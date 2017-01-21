import flask
import gevent.monkey
import gevent.pywsgi
import pymongo
import requests
import json
import cffi
import hashlib
import time

ffi = cffi.FFI()

ffi.cdef('''
char * zhixue_pw_encode(const char *src);
char * get_random_string(int length);
void free_memory();
''')

utils = ffi.dlopen("./utils.so")

targetDb = pymongo.MongoClient().HydroCloud_EventTimeline

noCache = True

gevent.monkey.patch_all()

app = flask.Flask(__name__)

@app.route("/login/zhixue", methods = ["POST"])
def onZhixueLogin():
    resp = flask.Response("Unknown error")
    resp.headers["Access-Control-Allow-Origin"] = "*";

    try:
        req_data = json.loads(flask.request.get_data())
    except ValueError:
        resp.set_data("Unable to parse request")
        return resp

    if req_data == None:
        resp.set_data("Bad request data")
        return resp
    
    login_name = req_data["loginName"]
    pw = req_data["password"]

    if login_name == None or pw == None or type(login_name) != unicode or type(pw) != unicode:
        resp.set_data("Bad arguments")
        return resp

    encoded_pw = ffi.string(utils.zhixue_pw_encode(pw.encode("utf-8")))
    utils.free_memory()

    if encoded_pw == None:
        resp.set_data("Illegal password")
        return resp

    post_data = {
        "loginName": login_name,
        "password": encoded_pw,
        "description": "{'encrypt':['password']}"
    }

    post_headers = {
        "authbizcode": "0001",
        "authguid": "11da01c3-a738-464d-ade2-58f5d97a14c6",
        "authtimestamp": "1476610394830",
        "authtoken": "08d558fedeeaaa299fd5920090175302"
    }

    zx_resp = requests.post("http://www.zhixue.com/container/app/login", data = post_data)
    
    try:
        zx_resp_json = json.loads(zx_resp.text)
    except ValueError:
        resp.set_data("Unable to parse zhixue response")
        return resp
    
    if zx_resp_json["errorCode"] != 0 or zx_resp_json["result"]["token"] == None or type(zx_resp_json["result"]["token"]) != unicode:
        resp.set_data("Error code: " + str(zx_resp_json["errorCode"]))
        return resp
    
    client_token = ffi.string(utils.get_random_string(16))
    utils.free_memory()

    targetDb.client_tokens.insert({
        "client_token": client_token,
        "zhixue_token": zx_resp_json["result"]["token"],
        "login_name": login_name,
        "zhixue_user_id": zx_resp_json["result"]["id"]
    })
    
    resp_json = {
        "token": client_token,
        "user_id": zx_resp_json["result"]["id"]
    }

    resp.set_data(json.dumps(resp_json))

    return resp

@app.route("/exams/list", methods = ["POST"])
def onExamList():
    resp = flask.Response("Unknown error")
    resp.headers["Access-Control-Allow-Origin"] = "*";

    req_data = json.loads(flask.request.get_data())

    client_token = req_data["token"]
    token_props = targetDb.client_tokens.find_one({
        "client_token": client_token
    })

    if token_props == None:
        resp.set_data("Invalid token")
        return resp
    
    if noCache == False:
        user_exam_list_props = targetDb.user_exam_lists.find_one({
            "login_name": token_props["login_name"]
        })

        if user_exam_list_props != None:
            current_time = time.time()
            if current_time - user_exam_list_props["update_time"] > 86400:
                targetDb.user_exam_lists.remove({
                    "_id": user_exam_list_props["_id"]
                })
            else:
                resp.set_data(user_exam_list_props["list_content"])
                return resp

    token = token_props["zhixue_token"]

    req_args = {
        "pageIndex": "1",
        "pageSize": "2147483647",
        "token": token,
        "version": "1.1"
    }

    zx_resp = requests.get("http://app.zhixue.com/study/report/get/exam/list", params = req_args)

    zx_resp_json = json.loads(zx_resp.text)

    if zx_resp_json["errorCode"] != 0:
        resp.set_data("Error code: " + str(zx_resp_json["errorCode"]))
        return resp
    
    resp_json = []

    for item in zx_resp_json["result"]:
        new_item = {
            "time": item["examCreateDateTime"],
            "id": item["examId"],
            "name": item["examName"],
            "score": item["score"],
        }

        resp_json.append(new_item)
    
    result_json = json.dumps(resp_json)

    targetDb.user_exam_lists.insert({
        "login_name": token_props["login_name"],
        "list_content": result_json,
        "update_time": time.time()
    })
    
    resp.set_data(result_json)

    return resp

@app.route("/exams/details", methods = ["POST"])
def onExamDetails():
    resp = flask.Response("Unknown error")
    resp.headers["Access-Control-Allow-Origin"] = "*";

    req_data = json.loads(flask.request.get_data())

    client_token = req_data["token"]
    token_props = targetDb.client_tokens.find_one({
        "client_token": client_token
    })

    if token_props == None:
        resp.set_data("Invalid token")
        return resp
    
    if req_data["examId"] == None or type(req_data["examId"]) != unicode:
        resp.set_data("Invalid exam id")
        return resp
    
    exam_id = req_data["examId"]

    if noCache == False:
        user_exam_detail_props = targetDb.user_exam_details.find_one({
            "login_name": token_props["login_name"],
            "exam_id": exam_id
        })

        if user_exam_detail_props != None:
            current_time = time.time()
            if current_time - user_exam_detail_props["update_time"] > 86400:
                targetDb.user_exam_details.remove({
                    "_id": user_exam_detail_props["_id"]
                })
            else:
                resp.set_data(user_exam_detail_props["detail_content"])
                return resp

    token = token_props["zhixue_token"]

    req_data = {
        "examId": req_data["examId"],
        "token": token
    }

    zx_resp = requests.post("http://app.zhixue.com/study/report/exam/getScoreAndRank", data = req_data)
    
    zx_resp_json = json.loads(zx_resp.text)

    resp_json = []

    for subject in zx_resp_json["result"]["userExamData"]:
        new_subject = {
            "name": subject["subjectName"],
            "score": subject["score"],
            "paper_id": subject["paperId"],
            "details": {
                "class": {
                    "rank": subject["classRank"]["rank"],
                    "total": subject["classRank"]["totalNum"],
                    "average": subject["classRank"]["avgScore"],
                    "highest": subject["classRank"]["highScore"]
                },
                "grade": {
                    "rank": subject["gradeRank"]["rank"],
                    "total": subject["gradeRank"]["totalNum"],
                    "average": subject["gradeRank"]["avgScore"],
                    "highest": subject["gradeRank"]["highScore"]
                }
            }
        }
        resp_json.append(new_subject)
    
    result_json = json.dumps(resp_json)

    targetDb.user_exam_details.insert({
        "login_name": token_props["login_name"],
        "exam_id": exam_id,
        "detail_content": result_json,
        "update_time": time.time()
    })

    resp.set_data(result_json)

    return resp

if __name__ == "__main__":
    gevent_server = gevent.pywsgi.WSGIServer(("",6096), app)
    gevent_server.serve_forever()
