function getQueryString(name)
{
    var reg = new RegExp("(\\?|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.href.substr(1).match(reg);
    if(r) return unescape(r[2]);
    else return null;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function showAlert(msg) {
    $("#alert-content").html(msg);
    $("#alert-box").fadeIn();
}

function hideAlert() {
    $("#alert-box").fadeOut();
}

function doLocalLogout() {
    $("#main-progress-bar").fadeIn();
    $.post("local_logout", {}, function(resp) {
        $("#main-progress-bar").fadeOut();
        location.reload();
    });
}

function getZhixueExamDetails(targetElement) {
    if(targetElement.detailsLoaded) return;
    targetElement.detailsLoaded = true;

    $("#main-progress-bar").fadeIn();

    $.post("get_exam_details/service/zhixue", {
        "examId": targetElement.examId
    }, function(resp) {
        try {
            var respData = JSON.parse(resp);
        } catch(e) {
            showAlert("获取考试详情失败: " + resp);
            $("#main-progress-bar").fadeOut();
            return;
        }
        var doneCount = 0;
        var totalCount = respData.length;
        for(var id in respData) {
            (function() {
                var currentTargetElement = targetElement;
                var item = respData[id];
                $.post("get_service_user_id/service/zhixue", {}, function(resp) {
                    if(resp == "Zhixue user id not initialized") return;
                    var origText = $(currentTargetElement).html();
                    origText += "<br><br>科目: "+item.name
                        +"<br>分数: "+item.score
                        +"<br>班级均分: "+item.details.class.average
                        +"<br>班级最高分: "+item.details.class.highest
                        +"<br>班级排名: "+item.details.class.rank+"/"+item.details.class.total;
                    if(item.paper_id) origText += "<br><a href=\"http://www.zhixue.com/zhixuebao/checksheet/?userId="+resp+"&examId="+currentTargetElement.examId+"&paperId="+item.paper_id+"\">查看试卷</a>";
                    $(currentTargetElement).html(origText);
                    doneCount++;
                    if(doneCount == totalCount) $("#main-progress-bar").fadeOut();
                });
            })();
        }
    })
}

function getZhixueExams() {
    $("#main-progress-bar").fadeIn();
    $.post("get_current_internal_exam_info/service/zhixue", {}, function(resp) {
        try {
            var respData = JSON.parse(resp);
        } catch(e) {
            return;
        }

        for(var i = 0; i < respData.length; i++) {
            var item = respData[i];

            var newElement = document.createElement("div");
            newElement.className = "block-card";
            $(newElement).css("color", "#0066CC");
            newElement.innerHTML = "[Internal Data]<br>";
            newElement.innerHTML += "姓名: " + item.user_name + "<br>";
            newElement.innerHTML += "学科: " + item.subject + "<br>";
            newElement.innerHTML += "分数: " + item.user_score + "<br>";
            newElement.innerHTML += "班级名次: " + item.user_class_rank + "<br>";
            newElement.innerHTML += "年级名次: " + item.user_grade_rank + "<br>"; 
            newElement.innerHTML += "更新时间: " + item.create_time;

            document.getElementById("exam-cards").appendChild(newElement);
        }
    });
    $.post("list_exams/service/zhixue", {}, function(resp) {
        $("#main-progress-bar").fadeOut();
        try {
            var respData = JSON.parse(resp);
        } catch(e) {
            showAlert("获取考试信息失败: " + resp);
            return;
        }

        for(var id = respData.length - 1; id >= 0; id--) {
            var item = respData[id];

            var newElement = document.createElement("div");
            newElement.className = "block-card";
            newElement.innerHTML = "<strong>"+item.name+"</strong><br>总分: "+item.score.toString();
            newElement.examId = item.id;

            $(newElement).click(function() {
                getZhixueExamDetails(this);
            });

            document.getElementById("exam-cards").appendChild(newElement);
        }
    });
}

function handleZhixueLogin() {
    $("#zhixue-login-card").fadeOut();
    
    getZhixueExams();
}

function hashLoginName(loginName) {
    var hash = 5381;
    var ln_length = loginName.length;

    for(var i = 0; i < ln_length; i++) {
        hash = (hash << 5 + hash) + loginName.charCodeAt(i);
    }

    return hash;
}

function redirectToLogin() {
    setCookie("HyperIdentity-Session-Status", "Pending", 0.001);
    window.location = sso_url + "identity/user/login?callback=" + encodeURIComponent(location.href.split("?")[0]);
}

function onZhixueLoginClick() {
    var loginName = $("#zhixue-loginName").val();
    var pw = $("#zhixue-password").val();

    $("#main-progress-bar").fadeIn();

    localStorage.setItem("HydroCloud-EventTimeline-Zhixue-Login-Name", loginName);

    var lnHash = hashLoginName(loginName);
    var pw_xor = "";
    for(var i = 0; i < pw.length; i++) {
        pw_xor += (lnHash ^ pw.charCodeAt(i)).toString() + "_";
    }

    localStorage.setItem("HydroCloud-EventTimeline-Zhixue-Login-Password", pw_xor);

    $.post("login/service/zhixue", {
        "loginName": loginName,
        "password": pw
    }, function(resp) {
        $("#main-progress-bar").fadeOut();
        if(resp != "OK") {
            if(resp == "HyperIdentity authentication required") {
                showAlert("需要认证");
                redirectToLogin();
                return;
            } else {
                showAlert("登录失败: "+resp);
                return;
            }
        }

        handleZhixueLogin();
    });
}

function showScoreLookupModule() {
    $(".page-module").fadeOut();
    $("#get-my-score").fadeIn();
    $(".nav-button").removeClass("active");
    $("#nav-button-score-lookup").addClass("active");
}

function showCloudEduNotificationModule() {
    $(".page-module").fadeOut();
    $("#cloudedu-notification").fadeIn();
    $(".nav-button").removeClass("active");
    $("#nav-button-cloudedu-notification").addClass("active");
}

function onCloudEduLoginClick(noUpdateUserDevice) {
    var deviceIdPrefix = $("#cloudedu-device-id").val();
    if(noUpdateUserDevice) noUpdateUserDevice = true;
    else {
        noUpdateUserDevice = false;
        localStorage.cloudEduDeviceIdPrefix = deviceIdPrefix;
    }
    $("#main-progress-bar").fadeIn();
    $.post("/et/cloudedu/fetch_notifications", {
        "device": deviceIdPrefix,
        "no_update_user_device": noUpdateUserDevice
    }, function(resp) {
        if(!resp) {
            showAlert("获取失败。");
            $("#main-progress-bar").fadeOut();
            return;
        }
        try {
            var data = JSON.parse(resp);
        } catch(e) {
            if(resp == "HyperIdentity authentication required") {
                redirectToLogin();
                return;
            }
            showAlert("获取失败: " + resp);
            $("#main-progress-bar").fadeOut();
            return;
        }
        hideAlert();
        document.getElementById("cloudedu-notification-cards").innerHTML = "";
        for(var id = 0; id < data.length; id++) {
            var item = data[id];

            var newElement = document.createElement("div");
            newElement.className = "block-card";
            newElement.innerHTML = "<strong>"+new Date(item.time).toLocaleString()+"</strong><br>"+item.content;

            document.getElementById("cloudedu-notification-cards").appendChild(newElement);
        }
        $("#main-progress-bar").fadeOut();
    });
}

if(getCookie("HyperIdentity-Session-Status") == "Pending") {
    setCookie("HyperIdentity-Session-Status", "", 0);

    var clientToken = getQueryString("client_token");
    if(!clientToken) showAlert("无法获取 Token , 认证失败");

    $.post("check_sso_status", {
        "client_token": clientToken.split("?")[0]
    }, function(resp) {
        if(resp != "OK") showAlert("认证失败");
        else window.location = location.href.split("?")[0];
    });
}

var savedZhixueLoginName = localStorage.getItem("HydroCloud-EventTimeline-Zhixue-Login-Name");
var savedZhixueLoginPw = localStorage.getItem("HydroCloud-EventTimeline-Zhixue-Login-Password");

if(savedZhixueLoginName && savedZhixueLoginPw) {
    $("#zhixue-loginName").val(savedZhixueLoginName);
    var lnHash = hashLoginName(savedZhixueLoginName);
    var pw_xor_arr = savedZhixueLoginPw.split("_");
    var pw = "";
    for(var i = 0; i < pw_xor_arr.length - 1; i++) {
        pw += String.fromCharCode(parseInt(pw_xor_arr[i]) ^ lnHash);
    }
    $("#zhixue-password").val(pw);
}

if(!getQueryString("no_auto_login")) $.post("check_login_status/service/zhixue", {}, function(resp) {
    if(resp == "OK") handleZhixueLogin();
});

if(!getQueryString("no_auto_login")) $.post("auto_login/service/zhixue", {}, function(resp) {
    if(resp == "OK") handleZhixueLogin();
});

$.post("get_sso_username", {}, function(resp) {
    if(resp != "HyperIdentity authentication required") {
        $(".dropdown-options-if-not-logged-in").hide();
        $(".dropdown-options-if-logged-in").show();
        $("#dropdown-username").html(resp);
    } else {
        $(".dropdown-options-if-not-logged-in").show();
        $(".dropdown-options-if-logged-in").hide();
    }
});

if(getQueryString("cloudedu_device")) {
    $("#cloudedu-device-id").val(getQueryString("cloudedu_device"));
    onCloudEduLoginClick(true);
    showCloudEduNotificationModule();
} else if(localStorage.cloudEduDeviceIdPrefix) {
    $("#cloudedu-device-id").val(localStorage.cloudEduDeviceIdPrefix);
    onCloudEduLoginClick();
} else {
    $.post("/et/cloudedu/get_user_device", "", function(resp) {
        if(!resp || resp == "HyperIdentity authentication required") {
            return;
        }
        $("#cloudedu-device-id").val(resp);
        onCloudEduLoginClick();
    });
}
