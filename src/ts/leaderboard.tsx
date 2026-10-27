import { useState } from 'react'
import React from 'react'
import '../css/leaderboard_page.css'
import NavigationBar from './navbar.tsx';
import { selectAllItems, pullPosts } from './DynamoFunctions.ts';
import type { Schema } from "../amplify/data/resource";
import { client } from "../api/client";

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
	const [error, setError] = useState('');
	const [Suggestion, setSuggestion] = useState<Schema['Suggestion']['type'][]>([]);

	// Test function for working with the schema
	const fetchSuggestions = async () => {
		setError('');

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

		console.log('suggestion created: ', data);
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
  
	return (
		<>
			<div>
				<h1>Weekly Leaderboard</h1>
			</div>

			<button onClick={createSuggestion}>
				{"Create Suggestion"}
			</button>

			<button onClick={fetchSuggestions}>
				{"Fetch Suggestion"}
			</button>

			{posts}
			<NavigationBar />    
		</>
	)
}

export default Leadboard
