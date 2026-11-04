/*
* Code Reviewed By Brandon 11/1/2026.
* Changed Suggestions values to match the recent updates to the Suggestions table.
* Fixed a bug in the selection sort that ignored the last item in the array.
*/

import { useEffect, useState } from 'react'
import React from 'react'
import '../css/leaderboard_page.css'
import NavigationBar from './navbar.tsx';
import { selectAllItems, pullPosts } from './DynamoFunctions.ts';
import { S3Client } from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  ExecuteStatementCommand,
  BatchExecuteStatementCommand,
} from "@aws-sdk/lib-dynamodb";
import { fromIni, fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb'
import { getPositionOfLineAndCharacter } from 'typescript';


// object for each individual post
const Post = ({ username, content, comment_count = 0, like_count, order_id } = { username: '', content: '', comment_count: '', like_count: '', order_id: '' }) => {
  // fill in with comments from aws (comment objects)
  let user = username
  let text = content
  let comments = comment_count
  let likes = like_count
  let id = order_id

  return (
    <div className='post_background' id={id}>
      <h2 className='post_username'>{user}</h2>
      <p className='post_content'>{text}</p>
      <div className='comments_background'>
        <p><b>Likes {likes}</b></p>
        <h2 id={likes}></h2>
      </div>
    </div>
  )
};

// object for leaderboard page
function Leaderboard() {
  let [posts, setPosts] = useState<any[]>();
  let [resorted, setResorted] = useState(0);

  // This is the function that generates the list of posts, it will run everytime the page loads.
  useEffect(() => {
    async function getPosts() {

      // client for accessing Suggestions table with cognito identity pool 
      // that has read access to the table. 
      const client = new DynamoDBClient(
        {
          region: "us-east-2",
          credentials: fromCognitoIdentityPool({
            identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
          }),
        });
      
      
      // pull every post, might add pagation if number of posts gets excessive.
      const docClient = DynamoDBDocumentClient.from(client);
      const params = {
        Statement: `SELECT * FROM Suggestions`,
      };
    
      try {
        const data = await docClient.send(new ExecuteStatementCommand(params));
        console.log("Items retrieved successfully");

        // grab array of items from api response
        let post_list = data.Items
        let posts_temp = []
        // add try/except for that

        // for each post in the list, push corresponding information
        // to the posts object. 
        for (let i = 0; i < post_list.length; i++) {
          let post = JSON.parse(JSON.stringify(post_list[i]))

          posts_temp.push(Post({
            username: String(post.pseudonym),
            content: String(post.text),
            comment_count: String(post.comments),
            like_count: String(post.likes),
            order_id: String(post.suggestionId)
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

  // updates listing when 'resorted' variable updates
  useEffect(() => {
    console.log(posts)
  }, [resorted]);

  // resorts current list of posts by like count.
  function sort_likes() {
    console.log("sorted by likes")
    let temp_posts = posts
    let min = 0
    let n = temp_posts.length

    // basic seletion sort
    for (let i = 0; i < n; i++) {
      min = i
      for (let j = i + 1; j < n; j++) {
        if (Number(temp_posts[j].props.children[2].props.children[1].props.id) > Number(temp_posts[min].props.children[2].props.children[1].props.id)) {
          min = j;
        }
      }

      let temp = temp_posts[i];
      temp_posts[i] = temp_posts[min];
      temp_posts[min] = temp;
    };

    // update Posts and then re-render by calling resorted UseEffect function with resorted update. 
    setPosts(temp_posts);
    setResorted(resorted + 1);
  };

  // resorts current list of posts by recency.
  function sort_recency() {
    console.log("sorted by recency")
    let temp_posts = posts
    let max = 0
    let n = temp_posts.length

    // seletion sort
    for (let i = 0; i < n; i++) {
      max = i
      for (let j = i + 1; j < n; j++) {
        if (temp_posts[j].props.id > temp_posts[max].props.id) {
          max = j;
        }
      }

      let temp = temp_posts[i];
      temp_posts[i] = temp_posts[max];
      temp_posts[max] = temp;

    }
    
    // update Posts and then re-render by calling resorted UseEffect function with resorted update. 
    setPosts(temp_posts);
    setResorted(resorted + 1);

  };

  return (
    <>
      <div>
        <h1 className='heading'>Weekly Leaderboard</h1>
      </div>
      <NavigationBar />

      <div>
        <button className='sort_button' onClick={sort_likes}>LIKES</button>
        <button className='sort_button' onClick={sort_recency}>NEWEST</button>
      </div>
      <div>{posts}</div>
    </>
  )
}

export default Leaderboard
