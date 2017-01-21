import json
import time
import socket

class Context:
    def __init__(self, port = None, addr = None):
        if port == None:
            port = 5619
        if addr == None:
            addr = "127.0.0.1"
        
        self.port = port
        self.addr = addr
    
    def request(self, data):
        data_str = json.dumps(data)
        conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        conn.connect( (self.addr, self.port) )
        conn.send(data_str)
        recv_data = conn.recv(1024)
        conn.close()
        recv_dict = json.loads(recv_data)
        return recv_dict

    def add_event(self, user_id, title, description, event_time = None):
        if event_time == None:
            event_time = int(time.time() * 1000)
        
        data = {
            "action": "addEvent",
            "eventUserId": user_id,
            "eventTitle": title,
            "eventDescription": description,
            "eventTime": event_time
        }
        result = self.request(data)
        if result["err"] != 0:
            raise RuntimeError(result)
        return result["eventId"]
