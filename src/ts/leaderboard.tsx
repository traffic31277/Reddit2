/*
* Code Reviewed By Brandon 11/1/2026.
* Keeps the original LIKES and NEWEST sorting options.
*/

import { useEffect, useState } from 'react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ExecuteStatementCommand } from '@aws-sdk/lib-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import NavigationBar from './navbar.tsx';
import SuggestionComments from './SuggestionComments.tsx';
import SuggestionVotes from './SuggestionVotes.tsx';
import '../css/leaderboard_page.css';

interface Suggestion {
    userId: string;
    suggestionId: string;
    pseudonym: string;
    text: string;
    likes: number;
    dislikes: number;
    comments: number;
}

interface PostProps {
    suggestion: Suggestion;
    onCountsChange: (suggestion: Suggestion, likes: number, dislikes: number) => void;
}

function Post({ suggestion, onCountsChange }: PostProps) {
    return (
        <div className='post_background' id={suggestion.suggestionId}>
            <div className='post_main_row'>
                <div className='post_text_column'>
                    <h2 className='post_username'>{suggestion.pseudonym}</h2>
                    <p className='post_content'>{suggestion.text}</p>
                </div>

                <aside className='post_vote_column' aria-label='Like or dislike this suggestion'>
                    <SuggestionVotes
                        suggestionId={suggestion.suggestionId}
                        suggestionUserId={suggestion.userId}
                        likes={suggestion.likes}
                        dislikes={suggestion.dislikes}
                        onCountsChange={(likes, dislikes) => onCountsChange(suggestion, likes, dislikes)}
                    />
                </aside>
            </div>

            <div className='comments_section'>
                <SuggestionComments
                    suggestionId={suggestion.suggestionId}
                    suggestionUserId={suggestion.userId}
                    initialCommentCount={suggestion.comments}
                />
            </div>
        </div>
    );
}

export default function Leaderboard() {
    const [posts, setPosts] = useState<Suggestion[]>([]);
    const [sortBy, setSortBy] = useState<'none' | 'likes' | 'newest'>('none');
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function getPosts() {
            const client = new DynamoDBClient({
                region: 'us-east-2',
                credentials: fromCognitoIdentityPool({
                    identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
                }),
            });
            const docClient = DynamoDBDocumentClient.from(client);

            try {
                const allPosts: Suggestion[] = [];
                let nextToken: string | undefined;

                do {
                    const result = await docClient.send(new ExecuteStatementCommand({
                        Statement: 'SELECT * FROM Suggestions',
                        NextToken: nextToken,
                    }));

                    for (const item of result.Items ?? []) {
                        allPosts.push({
                            userId: String(item.userId),
                            suggestionId: String(item.suggestionId),
                            pseudonym: String(item.pseudonym ?? 'Anonymous'),
                            text: String(item.text ?? ''),
                            likes: Number(item.likes ?? 0),
                            dislikes: Number(item.dislikes ?? 0),
                            comments: Number(item.comments ?? 0),
                        });
                    }

                    nextToken = result.NextToken;
                } while (nextToken);

                if (active) {
                    setPosts(allPosts);
                }
            } catch (err) {
                console.error('Error retrieving suggestions:', err);
                if (active) {
                    setError('Could not load suggestions.');
                }
            }
        }

        void getPosts();
        return () => { active = false; };
    }, []);

    function updateVoteCounts(suggestion: Suggestion, likes: number, dislikes: number) {
        setPosts((currentPosts) => currentPosts.map((post) => {
            if (post.userId === suggestion.userId && post.suggestionId === suggestion.suggestionId) {
                return { ...post, likes, dislikes };
            }
            return post;
        }));
    }

    const visiblePosts = [...posts];
    if (sortBy === 'likes') {
        visiblePosts.sort((first, second) => second.likes - first.likes);
    } else if (sortBy === 'newest') {
        visiblePosts.sort((first, second) => second.suggestionId.localeCompare(first.suggestionId));
    }

  return (
    <>
      <div>
        <h1 className='heading'>Weekly Leaderboard</h1>
      </div>
      
      <NavigationBar />

            <div>
                <button className='sort_button' onClick={() => setSortBy('likes')}>LIKES</button>
                <button className='sort_button' onClick={() => setSortBy('newest')}>NEWEST</button>
            </div>

            {error && <p role='alert'>{error}</p>}
            <div>
                {visiblePosts.map((suggestion) => (
                    <Post
                        key={`${suggestion.userId}/${suggestion.suggestionId}`}
                        suggestion={suggestion}
                        onCountsChange={updateVoteCounts}
                    />
                ))}
            </div>
      </>
    );
}
