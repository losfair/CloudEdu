<?php

class EventStreamClientContext {
    private $port, $addr;

    public function __construct($new_port = 5619, $new_addr = "172.16.8.1") {
        $this -> port = $new_port;
        $this -> addr = $new_addr;
    }

    public function request($data) {
        $data = json_encode($data);
        $sock = socket_create(
            AF_INET,
            SOCK_STREAM,
            SOL_TCP
        );
        $ret = socket_connect($sock, $this -> addr, $this -> port);
        assert($ret);

        socket_write($sock, $data);

        $resp = "";
        while($d = socket_read($sock, 4096, PHP_BINARY_READ)) {
            $resp .= $d;
        }

        return json_decode($resp);
    }

    public function add_event($eventUserId, $eventTitle, $eventDescription, $eventTime) {
        $resp = $this -> request([
            "action" => "addEvent",
            "eventUserId" => $eventUserId,
            "eventTitle" => $eventTitle,
            "eventDescription" => $eventDescription,
            "eventTime" => $eventTime
        ]);
        return $resp;
    }

    public function get_events($eventUserId, $maxEventCount = -1) {
        if($maxEventCount < 0) {
            return $this -> request([
                "action" => "getAllEvents",
                "eventUserId" => $eventUserId
            ]);
        } else {
            return $this -> request([
                "action" => "getRecentEvents",
                "eventUserId" => $eventUserId,
                "eventCount" => $maxEventCount
            ]);
        }
    }
}

?>
