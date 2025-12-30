import { useEffect } from "react"
import { useUser } from "../context/UserContext";

const SilentLogin = () => {
    const { login, isLoggout, loginWithRedirect } = useUser();
    useEffect(() => {
        loginWithRedirect();
    }, []);
    return (
        <div>Login</div>
    )
}
export default SilentLogin;