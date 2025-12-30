import OktaLoginModal from "./components/OktaLogin";
import { useAuth0 } from "@auth0/auth0-react";
import { UserContextProvider } from "./context/UserContext";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";



const App = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <>
      {!isAuthenticated && !import.meta.env.VITE_DEV ? (
        <OktaLoginModal />
      ) : (
        <div>
         
            <BrowserRouter>
              <Dashboard />
            </BrowserRouter>
          
        </div>
      )}
    </>
  );
};
export default App;