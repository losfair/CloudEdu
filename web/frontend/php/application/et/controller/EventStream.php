<?php
namespace app\et\controller;

use think\Db;
use \EventStreamClientContext;

require("event_stream_service_api.php");

class EventStream {
    private $esClientContext = null;
    private $initialized = false;

    private function init() {
        if($this -> initialized) return;
        $this -> esClientContext = new EventStreamClientContext();
        $this -> initialized = true;
    }

    public function fetch() {
        $this -> init();

        $count = (int) $_POST["count"];

        if(!session("HyperIdentity-User-Name")) {
            return "HyperIdentity authentication required";
        }

        $ssoUsername = session("HyperIdentity-User-Name");

        $result = $this -> esClientContext -> get_events(
            md5($ssoUsername),
            (int) $count
        );

        return json_encode($result);
    }
}
