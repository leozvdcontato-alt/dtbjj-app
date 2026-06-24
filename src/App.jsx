import { useState } from "react";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {

  const [user, setUser] = useState(null);

  if (!user) {

    return (
      <Login setUser={setUser} />
    );
  }

  return (

    <Dashboard
      user={user}
      setUser={setUser}
    />

  );
}