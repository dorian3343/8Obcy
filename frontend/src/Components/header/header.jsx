import "./header.css"
import logo1 from  "./logo1.png"
function Header({UserCount}){
    return(
        <div className="header-wrapper">
            <img src={logo1} alt="logo" className="logo"/>
            <p className="user-count">{UserCount} osób online</p>
    </div>);
}
export default Header