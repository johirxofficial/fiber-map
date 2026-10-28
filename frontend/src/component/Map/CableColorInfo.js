const parentStyle = {
  position: "absolute",
  zIndex: 700,
  right: "60px",
  marginTop: "10px",
  border: "1px solid red",
  display: "flex",
  flexWrap: "wrap",
  width: "250px",
  padding: "5px",
  borderRadius: "5px",
};

const childStyle = { display: "flex", flex: 1, minWidth: "70px" };
const CableColorInfo = () => {
  return (
    <div style={parentStyle}>
      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#0000FF",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>2 core</span>
      </div>

      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#FF0000",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>4 core</span>
      </div>
      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#000000",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>6 core</span>
      </div>
      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#800080",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>8 core</span>
      </div>
      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#FFA500",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>12 core</span>
      </div>
      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#FFFF00",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>24 core</span>
      </div>
      <div style={childStyle}>
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: "#008000",
          }}
        ></div>
        <span style={{ marginLeft: "5px" }}>48 core</span>
      </div>
    </div>
  );
};

export default CableColorInfo;
