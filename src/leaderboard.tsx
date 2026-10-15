import { useState } from 'react'
import React from 'react'
import './leaderboard.css'

const Post = ({username, content}) => {
  return (  
    <div class='post_background'>
      <h2 class='post_username'>{username}</h2>
      <p class='post_content'>{content}</p>
    </div>
  )
}

function Leadboard() {
  const posts = [];

  // This is the function that generates the list of posts,
  // Edit this to pull from db
  const genPosts = () => {
    let num = 10
    for (let i = 0; i < num; i++) {
        let user = 'Username'
        let cont = 'Post'
        posts.push(Post({username:user, content:cont}));
    }
  };
  
  genPosts();

  return (
    <>
    <div>
      <h1>Weekly Leaderboard</h1>
    </div>
    {posts}    
    </>
  )
}

export default Leadboard
