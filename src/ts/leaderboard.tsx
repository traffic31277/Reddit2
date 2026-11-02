import { useState, useEffect } from 'react'
import React from 'react'
import '../css/leaderboard_page.css'
import NavigationBar from './navbar.tsx';
import { selectAllItems, pullPosts } from './DynamoFunctions.ts';
// import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { S3Client } from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  ExecuteStatementCommand,
  BatchExecuteStatementCommand,
} from "@aws-sdk/lib-dynamodb";
import { fromIni, fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb'

const Post = ({username, content, comment_count=0}={username:'', content:'', comment_count:''}) => {
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

export default Leaderboard
