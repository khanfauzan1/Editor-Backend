import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../socket";
import {
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import { toast } from "react-hot-toast";

function EditorPage() {
  /////////////////////////////////////////////////////
  const [clients, setClients] = useState([]);
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => {
        handleError(err);
      });
      socketRef.current.on("connect_failed", (err) => {
        handleError(err);
      });

      const handleError = (e) => {
        console.log("socket error=>", e);
        toast.error("Socket connection failed");
        navigate("/");
      };
      socketRef.current.emit("join", {
        roomId,
        username: location.state?.username,
      });
      socketRef.current.on("joined", ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined`);
        }
        setClients(clients);
        socketRef.current.emit("sync-code", {
          code: codeRef.current,
          socketId,
        });
      });
      // disconnected
      socketRef.current.on("disconnected", ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();


    return () => {
      socketRef.current.disconnect();
      socketRef.current.off("joined");
      socketRef.current.off("disconnected");
    };
  }, []);
  ///////////////////////////////////////////////////////////////

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async ()=>{
    try{
      await navigator.clipboard.writeText(roomId);
      toast.success('roomId is copied')
    }
    catch(err){
      toast.error("Unable to copy RoomId ")
    }
  }

  const leaveRoom = async ()=>{
    navigate('/');
  }
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div
          className="col-md-2 bg-dark text-light d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0,0,0,0.1)" }}
        >
          <img
            src="/images/codecast.png"
            alt="Codecast"
            className="img-fluid mx-auto"
            style={{ maxWidth: "150px", marginTop: "-43px" }}
          />
          <hr style={{ marginTop: "-3rem" }} />
          {/* client list container */}
          <div className="d-flex flex-column overflow-auto">
            {/* Client */}
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-auto ">
            <hr />
            <button className="btn btn-success" onClick={copyRoomId} >Copy Room Id</button>
            <button className="btn btn-danger mt-2 mb-2 px-3 btn-block" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </div>
        {/* Editor */}
        <div className="col-md-10 text-light d-flex flex-column h-100">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => (codeRef.current = code)}
          />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
