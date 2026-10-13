import reactLogo from "./assets/react.svg";
import "./App.css";

// generate database based on Schema
const client = generateClient<Schema>();

// list all messages in the datbase's model (Message)
const { data } = await client.models.Message.list();

// create a message
const { errors, data: newMessage } = await client.models.Message.create({
  text: 'My message text'
});


function App({ signOut, user }) {
  return (
    <>
      <h1>Hello {user.username}</h1>
      <button onClick={signOut}>Sign out</button>
    </>
  );
}
export default App;