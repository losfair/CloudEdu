<?php
namespace app\et\controller;

use think\Db;

//const CLOUDEDU_API_URL = "https://hydrocloud.ntzx.cn/CloudEdu/";
const CLOUDEDU_API_URL = "http://172.16.8.1:7729/";

class Cloudedu {
    private function api_request($path, $data) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, CLOUDEDU_API_URL . $path);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json"
        ]);

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
    public function get_user_device() {
        if(!session("HyperIdentity-User-Name")) {
            return "HyperIdentity authentication required";
        }
        $ssoUsername = session("HyperIdentity-User-Name");

        $targetTable = Db::name("cloudedu_users");
        $result = $targetTable -> where([
            "sso_username" => $ssoUsername
        ]) -> select();

        if(count($result) > 0) {
            return $result[0]["device"];
        }

        return "";
    }
    public function fetch_notifications() {
        if(!session("HyperIdentity-User-Name")) {
            return "HyperIdentity authentication required";
        }
        $ssoUsername = session("HyperIdentity-User-Name");
        if(!$_POST || !isset($_POST["device"]) || !$_POST["device"]) {
            return "Bad request";
        }
        $ret = $this -> api_request("notification/fetch_with_prefix", [
            "deviceIdPrefix" => $_POST["device"]
        ]);
        if(!$ret) return "Failed";

        if(isset($_POST["no_update_user_device"]) && $_POST["no_update_user_device"]) {
            return json_encode($ret);
        }

        $targetTable = Db::name("cloudedu_users");

        $result = $targetTable -> where([
            "sso_username" => $ssoUsername
        ]) -> select();

        if(count($result) > 0) {
            if($_POST["device"] != $result[0]["device"]) {
                $targetTable -> where([
                    "_id" => $result[0]["_id"]
                ]) -> update([
                    "device" => $_POST["device"]
                ]);
            }
        } else {
            $targetTable -> insert([
                "sso_username" => $ssoUsername,
                "device" => $_POST["device"]
            ]);
        }

        return json_encode($ret);
    }
}
