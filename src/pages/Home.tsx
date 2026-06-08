import { Navigate } from "react-router-dom";

// /home is merged into /feed — redirect all traffic there.
const Home = () => <Navigate to="/feed" replace />;

export default Home;
