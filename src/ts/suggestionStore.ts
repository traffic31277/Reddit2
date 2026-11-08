import {
    DynamoDBDocumentClient,
    GetCommand,
    QueryCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

export type Vote = 'like' | 'dislike' | 'none';

export interface SuggestionKey {
    userId: string;
    suggestionId: string;
}

export interface CommentItem {
    suggestionId: string;
    commentId: string;
    suggestionUserId: string;
    userId: string;
    pseudonym: string;
    text: string;
    createdAt: string;
}

const defaultTables = {
    suggestions: 'Suggestions',
    comments: 'Comments',
    votes: 'SuggestionVotes',
    users: 'Users',
};

export function createSuggestionStore(client: DynamoDBDocumentClient, tables = defaultTables) {
    async function readSuggestion(key: SuggestionKey) {
        const response = await client.send(
            new GetCommand({
                TableName: tables.suggestions,
                Key: key,
                ConsistentRead: true,
            }),
        );

        if (!response.Item) {
            throw new Error('This suggestion is no longer available.');
        }

        return {
            likes: Number(response.Item.likes ?? 0),
            dislikes: Number(response.Item.dislikes ?? 0),
            comments: Number(response.Item.comments ?? 0),
        };
    }

    async function readVote(key: SuggestionKey, userId: string): Promise<Vote> {
        const response = await client.send(
            new GetCommand({
                TableName: tables.votes,
                Key: { suggestionId: key.suggestionId, userId },
                ConsistentRead: true,
            }),
        );

        const item = response.Item;
        if (item?.suggestionUserId && item.suggestionUserId !== key.userId) {
            throw new Error('This vote belongs to a different suggestion.');
        }
        if (item?.vote === 'like' || item?.vote === 'dislike') {
            return item.vote;
        }
        return 'none';
    }

    async function saveVote(key: SuggestionKey, userId: string, nextVote: Vote) {
        if (userId === key.userId) {
            throw new Error("You can vote on other users' suggestions.");
        }

        for (let attempt = 0; attempt < 4; attempt += 1) {
            const previousVote = await readVote(key, userId);
            if (previousVote === nextVote) {
                return { vote: nextVote, ...(await readSuggestion(key)) };
            }

            const likesChange = Number(nextVote === 'like') - Number(previousVote === 'like');
            const dislikesChange =
                Number(nextVote === 'dislike') - Number(previousVote === 'dislike');
            const voteKey = { suggestionId: key.suggestionId, userId };
            const voteCondition =
                previousVote === 'none'
                    ? { ConditionExpression: 'attribute_not_exists(userId)' }
                    : {
                          ConditionExpression: '#vote = :previous',
                          ExpressionAttributeNames: { '#vote': 'vote' },
                          ExpressionAttributeValues: { ':previous': previousVote },
                      };

            const voteWrite =
                nextVote === 'none'
                    ? { Delete: { TableName: tables.votes, Key: voteKey, ...voteCondition } }
                    : {
                          Put: {
                              TableName: tables.votes,
                              Item: { ...voteKey, suggestionUserId: key.userId, vote: nextVote },
                              ...voteCondition,
                          },
                      };

            let condition = 'attribute_exists(suggestionId)';
            const values: Record<string, number> = {
                ':likesChange': likesChange,
                ':dislikesChange': dislikesChange,
            };
            if (likesChange < 0) {
                condition += ' AND #likes >= :one';
                values[':one'] = 1;
            }
            if (dislikesChange < 0) {
                condition += ' AND #dislikes >= :one';
                values[':one'] = 1;
            }

            try {
                await client.send(
                    new TransactWriteCommand({
                        TransactItems: [
                            voteWrite,
                            {
                                Update: {
                                    TableName: tables.suggestions,
                                    Key: key,
                                    UpdateExpression:
                                        'ADD #likes :likesChange, #dislikes :dislikesChange',
                                    ConditionExpression: condition,
                                    ExpressionAttributeNames: {
                                        '#likes': 'likes',
                                        '#dislikes': 'dislikes',
                                    },
                                    ExpressionAttributeValues: values,
                                },
                            },
                        ],
                    }),
                );
                return { vote: nextVote, ...(await readSuggestion(key)) };
            } catch (error) {
                const name = (error as Error).name;
                if (name !== 'TransactionCanceledException' || attempt === 3) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
            }
        }
        throw new Error('Could not save your vote. Please try again.');
    }

    async function listComments(key: SuggestionKey): Promise<CommentItem[]> {
        const comments: CommentItem[] = [];
        let lastKey: Record<string, unknown> | undefined;

        do {
            const response = await client.send(
                new QueryCommand({
                    TableName: tables.comments,
                    KeyConditionExpression: 'suggestionId = :id',
                    FilterExpression:
                        'attribute_not_exists(suggestionUserId) OR suggestionUserId = :author',
                    ExpressionAttributeValues: { ':id': key.suggestionId, ':author': key.userId },
                    ScanIndexForward: true,
                    ConsistentRead: true,
                    ExclusiveStartKey: lastKey,
                }),
            );
            comments.push(...((response.Items ?? []) as CommentItem[]));
            lastKey = response.LastEvaluatedKey;
        } while (lastKey);

        return comments;
    }

    async function saveComment(
        key: SuggestionKey,
        userId: string,
        commentId: string,
        text: string,
    ): Promise<CommentItem> {
        const cleanedText = text.trim();
        const createdAt = commentId.slice('COMMENT_'.length);
        if (
            !commentId.startsWith('COMMENT_') ||
            !Number.isFinite(Date.parse(createdAt)) ||
            new Date(createdAt).toISOString() !== createdAt
        ) {
            throw new Error('The comment date is invalid. Please try again.');
        }
        if (!cleanedText || cleanedText.length > 1000) {
            throw new Error('Comments must contain 1 to 1000 characters.');
        }

        async function findSavedComment() {
            const response = await client.send(
                new GetCommand({
                    TableName: tables.comments,
                    Key: { suggestionId: key.suggestionId, commentId },
                    ConsistentRead: true,
                }),
            );
            const item = response.Item as CommentItem | undefined;
            if (
                item &&
                (item.userId !== userId ||
                    item.text !== cleanedText ||
                    item.suggestionUserId !== key.userId)
            ) {
                throw Object.assign(
                    new Error('Another comment used this timestamp. Please submit again.'),
                    {
                        name: 'CommentIdConflict',
                    },
                );
            }
            return item;
        }

        const existing = await findSavedComment();
        if (existing) {
            return existing;
        }

        const user = await client.send(
            new GetCommand({
                TableName: tables.users,
                Key: { userId },
            }),
        );
        const comment: CommentItem = {
            suggestionId: key.suggestionId,
            commentId,
            suggestionUserId: key.userId,
            userId,
            pseudonym: String(user.Item?.pseudonym ?? 'Anonymous'),
            text: cleanedText,
            createdAt,
        };

        try {
            await client.send(
                new TransactWriteCommand({
                    TransactItems: [
                        {
                            Put: {
                                TableName: tables.comments,
                                Item: comment,
                                ConditionExpression: 'attribute_not_exists(commentId)',
                            },
                        },
                        {
                            Update: {
                                TableName: tables.suggestions,
                                Key: key,
                                UpdateExpression: 'ADD #comments :one',
                                ConditionExpression: 'attribute_exists(suggestionId)',
                                ExpressionAttributeNames: { '#comments': 'comments' },
                                ExpressionAttributeValues: { ':one': 1 },
                            },
                        },
                    ],
                }),
            );
        } catch (error) {
            const saved = await findSavedComment();
            if (saved) {
                return saved;
            }
            throw error;
        }
        return comment;
    }

    return { readVote, saveVote, listComments, saveComment };
}
