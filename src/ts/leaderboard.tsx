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

function Leaderboard() {
  let [posts, setPosts] = useState<any[]>();
  
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
