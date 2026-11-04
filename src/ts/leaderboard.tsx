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

const Content = ({username, content, comment_count=0}={username:'', content:'', comment_count:''}) => {
  // fill in with comments from aws (comment objects)

	return (  
		<div className='post_background'>
			<h2 className='post_username'>{username}</h2>
			<p className='post_content'>{content}</p>
			<div className='comments_background'> 
				<p><b>comments</b> {comment_count}</p>
			</div>
		</div>
	)
};

function Leadboard() {
	const [error, setError] = useState('');

	// Test function for working with the schema
	const fetchSuggestions = async () => {
		const [Suggestion, setSuggestion] = useState<Schema['Suggestion']['type'][]>([]);
		setError('');

		setSuggestion([
			{
				text: "This is sample text",
				likes: 2,
				dislikes: 0
			},

			{
				text: "This is sample text",
				likes: 3,
				dislikes: 1
			},

			{
				text: "This is sample text",
				likes: 6,
				dislikes: 1
			},

		]);

		console.log('Current suggestions: ', Suggestion);

		try {
			const { data: suggestionList, errors, nextToken } = await client.models.Suggestion.list();

			if (errors) {
				console.error('Could not pull data: ', errors);
				setError(errors[0].message);
				return;
			}

			console.log('The data was found: ', suggestionList);
		}
		catch (err: any) {
			console.error('Could not pull data: ', err);
			setError(err.message);
		}
	}

	const createSuggestion = async () => {
		const { data, errors } = await client.models.Suggestion.create({
			text: "This is sample text",
			likes: 2,
			dislikes: 0
		});

		console.log('Errors: ', errors);
		console.log('Suggestion Object: ', data);
		console.log('Suggestion Owner: ', data?.owner);
		console.log('Suggestion Id: ', data?.id);
		console.log('Suggestion Message: ', data?.text);
	}

	const posts = [];

	// This is the function that generates the list of posts,
	// Edit this to pull from db
	// async function genPosts () {
	//   let posts_list = await pullPosts();
	//   for (let i = 0; i < posts_list.length; i++) {
	//     console.log(i);
	//     posts.push(Post({username:posts_list[0], content:posts_list[1], comment_count:Number(posts_list[2])}));
	//   }
	// };

	function genPosts () {
		for (let i = 0; i < 1; i++) {
			posts.push(Post({username:"Username", content:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque. is a suggestion :)", comment_count:2}));
			posts.push(Post({username:"Username", content:"Lorem ipsum dolor sit amet consectetur adipiscing elit.", comment_count:1}));
			posts.push(Post({username:"Username", content:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Elit quisque faucibus ex sapien vitae pellentesque sem. Sem placerat \
				in id cursus mi pretium tellus. Tellus duis convallis tempus leo eu aenean sed. Sed diam urna tempor pulvinar vivamus fringilla lacus. Lacus nec metus bibendum egestas \
				iaculis massa nisl. Nisl malesuada lacinia integer nunc posuere ut hendrerit. Lorem ipsum dolor sit amet consectetur adipiscing elit. Elit quisque faucibus ex sapien vitae \
				pellentesque sem. Sem placerat in id cursus mi pretium tellus. Tellus duis convallis tempus leo eu aenean sed. Sed diam urna tempor pulvinar vivamus fringilla lacus. Lacus \
				nec metus bibendum egestas iaculis massa nisl. Nisl malesuada lacinia integer nunc posuere ut hendrerit.", comment_count:3}));
		}
	};
	genPosts();
  
  // This is the function that generates the list of posts,
  useEffect(() => {
    async function getPosts() {
      let tableName = "Suggestions"
      const client = new DynamoDBClient(
        {
          region:"us-east-2",
          credentials: fromCognitoIdentityPool({
            identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
          }),
        });
      const docClient = DynamoDBDocumentClient.from(client);
      const params = {
        Statement: `SELECT * FROM "${tableName}"`,
      };

      try {
        const data = await docClient.send(new ExecuteStatementCommand(params));
        console.log("Items retrieved successfully");
        
        let post_list = data.Items
        let posts_temp = []
        // add try/except for that

        for (let i = 0; i < post_list.length; i++) {
          let post = JSON.parse(JSON.stringify(post_list[i]))

          posts_temp.push(Post({ 
            username: String(post.userId), 
            content: String(post.text),
            comment_count: String(0)
          }))
        }

        setPosts(posts_temp)

      } catch (err) {

        console.error("Error retrieving items:", err);
        throw err;
      }
    }

    getPosts();
  }, []);
  

  return (
    <>
    <div>
      <h1>Weekly Leaderboard</h1>
    </div>
    <div>{posts}</div>
    <NavigationBar />
    </>
  )
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
            // Preserve the existing DynamoDB connection for loading suggestions.
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

                // PartiQL can return multiple pages, so keep loading until it finishes.
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

    // These use the same sorting choices as the original leaderboard.
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

            <NavigationBar />
        </>
    );
}
