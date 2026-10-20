import { useState } from 'react'
import React from 'react'
import '../css/leaderboard_page.css'
import NavigationBar from './navbar.tsx';
import { selectAllItems, pullPosts } from './DynamoFunctions.ts';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const Post = ({username, content, comment_count=0}:{username:String; content: String; comment_count:Number}) => {
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
  const posts = [];

  // This is the function that generates the list of posts,
  // Edit this to pull from db
  async function genPosts () {
    let posts_list = await pullPosts();
    for (let i = 0; i < posts_list.length; i++) {
      console.log(i);
      posts.push(Post({username:posts_list[0], content:posts_list[1], comment_count:Number(posts_list[2])}));
    }

  }  
  
  genPosts();

  return (
    <>
    <div>
      <h1>Weekly Leaderboard</h1>
    </div>
    {posts}
    <NavigationBar />    
    </>
  )
}

export default Leadboard
