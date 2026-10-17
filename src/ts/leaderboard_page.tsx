import { useState } from 'react'
import React from 'react'
import '../css/leaderboard_page.css'

const Post = ({username, content, comment_count=0}) => {
  // fill in with comments from aws (comment objects)

  return (  
    <div class='post_background'>
      <h2 class='post_username'>{username}</h2>
      <p class='post_content'>{content}</p>
      <div class='comments_background'> 
        <b>comments</b> ({comment_count})
      </div>
    </div>
  )
};

function Leadboard() {
  const posts = [];

  // This is the function that generates the list of posts,
  // Edit this to pull from db
  const genPosts = () => {
    let num = 10
    for (let i = 0; i < num; i++) {
        let user = 'Username'
        let cont = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
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
