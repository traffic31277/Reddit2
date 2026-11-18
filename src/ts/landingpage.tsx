import { Link } from 'react-router-dom';
import profboxLogo from '../assets/profbox-logo.png';
import '../css/landingpage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <main className="landing-content">
        <h1 className="landing-logo">
          <img src={profboxLogo} alt="ProfBox" />
        </h1>

        <nav className="landing-buttons" aria-label="Account options">
          <Link to="/login" className="landing-button">Login</Link>
          <Link to="/signup" className="landing-button">Sign Up</Link>
        </nav>

        <Link to="/reset" className="landing-reset">Reset Password</Link>
      </main>
    </div>
  );
}
