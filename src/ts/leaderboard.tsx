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

const Post = ({username, content, comment_count=0, like_count, order_id=0}={username:'', content:'', comment_count:'', like_count:'', order_id:''}) => {
  // fill in with comments from aws (comment objects)
  let user = username
  let text = content 
  let comments = comment_count
  let likes = like_count
  let id = order_id

	return (  
		<div className='post_background'>
			<h2 className='post_username'>{user}</h2>
			<p className='post_content'>{text}</p>
			<div className='comments_background'> 
				<p><b>comments</b> {comments}</p>
			</div>
		</div>
	)
};

function Leaderboard() {
  let [posts, setPosts] = useState<any[]>();
  
  // This is the function that generates the list of posts,
  useEffect(() => {
    async function getPosts() {
      const client = new DynamoDBClient(
        {
          region:"us-east-2",
          credentials: fromCognitoIdentityPool({
            identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
          }),
        });
      const docClient = DynamoDBDocumentClient.from(client);
      const params = {
        Statement: `SELECT * FROM Suggestions`,
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
            comment_count: String(0),
            like_count: String(post.likes)
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
  
  function sort_likes() {
    console.log("sorted by likes")
    let min = 0
    
    // seletion sort
    for (let i = 0; i < posts.length-1; i++) {
      min = i
        for (let j = i + 1; j < n; j++) {
          if (posts[j].likes > posts[min].likes) {
              min = j;
            }
        }

      let temp = posts[i];
      posts[i] = posts[min];
      posts[min] = temp;
    }
  };

  function sort_recency() {
    console.log("sorted by recency")
    let min = 0
    
    // seletion sort
    for (let i = 0; i < posts.length-1; i++) {
      min = i
        for (let j = i + 1; j < n; j++) {
          if (posts[j].id > posts[min].id) {
              min = j;
            }
        }

      let temp = posts[i];
      posts[i] = posts[min];
      posts[min] = temp;
    }
  };

  return (
    <>
    <div>
      <h1>Weekly Leaderboard</h1>
    </div>
    <button onClick={sort_likes}>SORT BY LIKES</button>
    <button onClick={sort_recency}>SORT BY NEWEST</button>
    <div>{posts}</div>
    <NavigationBar />
    </>
  )
}

export default Leaderboard
