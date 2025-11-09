import logo from "../assets/hm-logo.png"

const Logo = () => {
    return (
        <div> 
            <img 
              src={logo} 
              alt="Headless Mouse Logo" 
              style={{
                height: "auto", 
                width: '100px',
                display: 'block',
                margin: '0 auto',
                position: "absolute",
                top: "10px",
                right: "80px"
              }}
            />
        </div>
    )
}

export default Logo