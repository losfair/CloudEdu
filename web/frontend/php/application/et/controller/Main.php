<?php
namespace app\et\controller;

use think\Db;
use \EventStreamClientContext;

require("event_stream_service_api.php");

class Main {
    private $esClientContext = null;
    private $initialized = false;

    private function init() {
        if($this -> initialized) return;
        $this -> esClientContext = new EventStreamClientContext();
        $this -> initialized = true;
    }

    private function backend_request($path, $data) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "http://localhost:6096/" . $path);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);

        if($data) {
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $output = curl_exec($ch);

        curl_close($ch);

        if(!$output || strlen($output) < 1 || ($output[0] != '{' && $output[0] != '[')) {
            return null;
        }

        $data = json_decode($output, true);
        if(!$data) return null;

        return $data;
    }

    private function get_sso_url() {
        return "https://hyperidentity.ifxor.com/";
    }

    public function index() {
        return view("main_view", [
            "sso_url" => $this -> get_sso_url()
        ]);
    }

    public function check_sso_status() {
        $clientToken = $_POST["client_token"];
        if(!$clientToken || strlen($clientToken) != 16) return "Invalid token";

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $this -> get_sso_url() . "identity/verify/verify_client_token");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);

        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            "client_token" => $clientToken
        ]));

        $output = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($output, true);
        if(!$data) return "Bad response";

        if($data["err"] != 0 || !$data["username"]) return "Authentication failed";

        if(!isset($data["domain"])) return "Unable to get domain";

        if($data["domain"] != "et.do-u-like.me" && $data["domain"] != "127.0.0.1:5011") return "Domain does not match";

        session("HyperIdentity-User-Name", $data["username"]);

        return "OK";
    }

    public function get_sso_username() {
        if(!session("HyperIdentity-User-Name")) {
            return "HyperIdentity authentication required";
        }

        return session("HyperIdentity-User-Name");
    }

    public function get_service_user_id($service) {
        if($service != "zhixue") {
            return "Service not supported";
        }

        if(!session("Zhixue-User-Id")) {
            return "Zhixue user id not initialized";
        }

        return session("Zhixue-User-Id");
    }

    public function local_logout() {
        if(!session("HyperIdentity-User-Name")) {
            return "Not logged in";
        }

        session("HyperIdentity-User-Name", null);
        session("Zhixue-Token", null);
        session("Zhixue-User-Id", null);
        session("Zhixue-User-Name", null);
        session("Zhixue-Login-Time", null);

        return "OK";
    }

    public function auto_login($service) {
        if(!session("HyperIdentity-User-Name")) {
            return "HyperIdentity authentication required";
        }

        $ssoUsername = session("HyperIdentity-User-Name");

        if($service != "zhixue") {
            return "Service not supported";
        }

        $targetTable = Db::name("zhixue_users");

        $result = $targetTable -> where([
            "sso_username" => $ssoUsername
        ]) -> select();

        if(count($result) <= 0) {
            return "Cannot do auto login. Login required";
        }

        $login_result = $this -> backend_request("login/zhixue", [
            "loginName" => $result[0]["loginName"],
            "password" => $result[0]["password"]
        ]);

        if(!$login_result || !$login_result["token"] || !$login_result["user_id"]) {
            return "Login failed";
        }

        session("Zhixue-Token", $login_result["token"]);
        session("Zhixue-User-Id", $login_result["user_id"]);
        session("Zhixue-User-Name", $result[0]["loginName"]);
        session("Zhixue-Login-Time", time());

        return "OK";
    }

    public function login($service) {
        $this -> init();

        if(!session("HyperIdentity-User-Name")) {
            return "HyperIdentity authentication required";
        }

        $ssoUsername = session("HyperIdentity-User-Name");

        if($service != "zhixue") {
            return "Service not supported";
        }

        $loginName = $_POST["loginName"];
        $pw = $_POST["password"];
        if(!$loginName || !$pw) return "Invalid request";

        $login_result = $this -> backend_request("login/zhixue", [
            "loginName" => $loginName,
            "password" => $pw
        ]);

        if(!$login_result || !$login_result["token"] || !$login_result["user_id"]) {
            return "Login failed";
        }

        $targetTable = Db::name("zhixue_users");

        $result = $targetTable -> where([
            "sso_username" => $ssoUsername
        ]) -> select();

        if(count($result) > 0) {
            if($loginName != $result[0]["loginName"] || $pw != $result[0]["password"]) {
                $targetTable -> where([
                    "_id" => $result[0]["_id"]
                ]) -> update([
                    "loginName" => $loginName,
                    "password" => $pw
                ]);
            }
        } else {
            $targetTable -> insert([
                "sso_username" => $ssoUsername,
                "loginName" => $loginName,
                "password" => $pw
            ]);
        }

        $this -> esClientContext -> add_event(
            md5($ssoUsername),
            "CloudEdu 用户登录",
            "登录第三方服务: " . $service,
            time() * 1000
        );

        session("Zhixue-Token", $login_result["token"]);
        session("Zhixue-User-Id", $login_result["user_id"]);
        session("Zhixue-User-Name", $loginName);
        session("Zhixue-Login-Time", time());

        return "OK";
    }

    public function get_current_internal_exam_info($service) {
        $token = session("Zhixue-Token");
        if(!$token) return "Invalid token";

        $currentUsername = session("Zhixue-User-Name");
        if(!$currentUsername) return "Invalid current user name";

        $result = Db::name("zhixue_user_exam_info_internal") -> where([
            "user_id" => intval($currentUsername)
        ]) -> select();
        
        if(count($result) <= 0) return "No records found";

        $ret = [
            "subject" => $result[0]["subject"],
            "user_name" => $result[0]["user_name"],
            "user_score" => $result[0]["user_score"],
            "user_class_rank" => $result[0]["user_class_rank"],
            "user_grade_rank" => $result[0]["user_grade_rank"],
            "create_time" => date("Y-m-d H:i:s", intval($result[0]["create_time"]))
        ];

        return json_encode([$ret]);
    }

    public function list_exams($service) {
        $token = session("Zhixue-Token");
        if(!$token) return "Invalid token";

        $ret = $this -> backend_request("exams/list", [
            "token" => $token
        ]);

        if(!$ret) return "Backend request failed";

        return json_encode($ret);
    }

    public function get_exam_details($service) {
        $token = session("Zhixue-Token");
        if(!$token) return "Invalid token";

        $examId = $_POST["examId"];
        if(!$examId) return "Exam id required";

        $ret = $this -> backend_request("exams/details", [
            "token" => $token,
            "examId" => $examId
        ]);

        if(!$ret) return "Backend request failed";

        return json_encode($ret);
    }

    public function check_login_status($service) {
        if(session("Zhixue-Token") && time() - session("Zhixue-Login-Time") < 600) return "OK";
        else return "Expired";
    }
}
