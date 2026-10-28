import { useState, useEffect } from 'react'
import React from 'react'
import '../css/leaderboard_page.css'
import NavigationBar from './navbar.tsx';
import { selectAllItems, pullPosts } from './DynamoFunctions.ts';
// import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ExecuteStatementCommand,
  BatchExecuteStatementCommand,
} from "@aws-sdk/lib-dynamodb";
import { fromIni, fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const Post = ({username, content, comment_count=0}={username:String, content:String, comment_count:Number}) => {
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
  let [posts, setPosts] = useState("POSTS COULD NOT BE FETCHED");
  
  // This is the function that generates the list of posts,
  useEffect(() => {
    async function getPosts() {
      let tableName = "Suggestion-kdkurq2ol5e2fcf73yfe5ta44e-NONE"
      const client = new DynamoDBClient(
        { profile:"default", 
          region:"us-east-2",
        });
      const docClient = DynamoDBDocumentClient.from(client);
      const params = {
        Statement: `SELECT * FROM "${tableName}"`,
      };

      try {
        const data = await docClient.send(new ExecuteStatementCommand(params));
        console.log("Items retrieved successfully");
        setPosts(String(data));

      } catch (err) {

        console.error("Error retrieving items:", err);
        throw err;
      }
    }

    getPosts();
  }, [posts]);
  
  function render_posts () {
    if (posts == "1") {
      posts = "0";
    } else {
      posts = "1"
    }
  }

  return (
    <>
    <div>
      <h1>Weekly Leaderboard</h1>
    </div>
    <p>{posts}</p>
    <button onClick={render_posts}>RENDER</button>
    <NavigationBar />
    </>
  )
}

export default Leaderboard
