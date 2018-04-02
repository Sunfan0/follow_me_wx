var debug = true;
var timestamp = "-0305";
var appid = "wxffe3dec08aa2449a";

//wxffe3dec08aa2449a
//10b04314fd28dfa6be962c72fe23d1e6

// var apiUri = debug ? "http://follow.xasqkj.com/admin/" : "http://follow.xasqkj.com/admin/";
// var ctxPath = debug ? "http://localhost:8090/follow_me_wx/" : "http://fm.xasqkj.com/";

var apiUri = debug ? "http://192.168.1.110:89/admin/" : "http://follow.xasqkj.com/admin/";
var ctxPath = debug ? "http://localhost:8080/follow_me_wx/" : "http://fm.xasqkj.com/";

var openid_cookie_key = "fm-open-id" + timestamp;
var wx_user_cookie_key = "fm-wx-user" + timestamp;

/**
 * Cookie 相关
 */
var ocean_cookie = function () {
    var self = this;

    this.getCookie = function (key) {
        key = key + timestamp;
        var arr, reg = new RegExp("(^| )" + key + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg)) {
            return decodeURI(arr[2]);
        } else {
            return null;
        }
    };

    this.setCookie = function (name, value, expiresIn) {
        name = name + timestamp;
        if (null == expiresIn) {
            expiresIn = 7 * 24 * 60 * 60 * 1000;
        }
        var exp = new Date();
        exp.setTime(exp.getTime() + expiresIn);
        document.cookie = name + "=" + encodeURI(value) + ";expires=" + exp.toGMTString() + ";path=/";
    };

    this.clearCookie = function (key) {
        var exp = new Date();
        exp.setTime(exp.getTime() - 10000);
        var cval = self.getCookie(key);
        if (cval != null) {
            document.cookie = key + timestamp + "=" + encodeURI(cval) + ";expires=" + exp.toGMTString() + ";path=/";
        }
    }
};


/**
 * 核心业务
 * @param cookie
 * @returns {ocean_core}
 */
var ocean_core = function (cookie) {
    var self = this;

    this.post = function (url, params, success, failure) {
        httpQuery(url, 'POST', params, success, failure);
    };

    this.get = function (url, params, success, failure) {
        httpQuery(url, 'GET', params, success, failure);
    };

    this.getLoginUserId = function () {
        return cookie.getCookie(login_user_cookie_key);
    };

    this.logout = function () {
        cookie.clearCookie(login_user_cookie_key);
    };

    this.currentCity = function () {
        return JSON.parse(cookie.getCookie(current_city_cookie_key) || "{}");
    };

    this.currentCityId = function () {
        return JSON.parse(cookie.getCookie(current_city_cookie_key) || "{}").id;
    };

    this.getOpenId = function () {
        return cookie.getCookie(openid_cookie_key);
    };

    this.getRequestParameter = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return decodeURI(r[2]);
        return null;
    };

    this.tip = function (message, callback) {
        weui.alert(message, callback, {});
    };

    this.toast = function (message) {
        weui.toast(message, {
            duration: 1000,
            className: "bears"
        });
    };

    function httpQuery(url, type, params, success, failure) {
        auth(function (token) {
            url = apiUri + url;
            $.ajax({
                url: url,
                headers: {
                    'Authorization': "Bearer " + token
                },
                type: type,
                data: params
            }).done(function (data) {
                success(data);
            }).fail(function (xhr) {
                try {
                    var error = xhr.responseJSON;
                    try {
                        failure(error);
                    } catch (e) {
                        ocean.tip(error.message);
                    }
                } catch (e) {
                }
            });
        });
    }

    function auth(callback) {
        var token = cookie.getCookie("ocean_access_token");
        if (null == token) {
            $.ajax({
                url: apiUri + 'authorization/token',
                type: 'POST',
                data: {
                    client: 'password',
                    secret: 'guest',
                }
            }).done(function (res) {
                console.log(res);
                if (res != null) {
                    cookie.setCookie("ocean_access_token", res, 7000000);
                    callback(res);
                } else {
                    ocean.tip("授权失败");
                }
            }).fail(function () {
                ocean.tip("授权失败");
            });
        } else {
            callback(token);
        }
    }

    function onBridgeReady(params, id, type, callBack) {
        WeixinJSBridge.invoke(
            'getBrandWCPayRequest', {
                "appId": params.appId,                 //公众号名称，由商户传入
                "timeStamp": params.timeStamp,         //时间戳，自1970年以来的秒数
                "nonceStr": params.nonceStr,           //随机串
                "package": params.package,
                "signType": params.signType,           //微信签名方式：
                "paySign": params.sign                 //微信签名
            },
            function (res) {
                if (res.err_msg == "get_brand_wcpay_request:ok") {
                    var loading = weui.loading('loading');
                    judgePaid(id, type, callBack, loading);
                }
            }
        );
    }

    function judgePaid(id, type, callback, loading) {
        self.get("resources/biz/order/isPaid", {id: id, type: type}, function (res) {
            if (res.code == 0) {
                loading.hide();
                if (callback) {
                    callback();
                } else {
                    location.href = ctxPath + "/page/order/success.html?id=" + id + "&type=" + type;
                }
            } else {
                setTimeout(function () {
                    judgePaid(id, type, callback);
                }, 1000);
            }
        });
    }

    /**
     * 支付
     * @param params
     * @param id
     * @param type
     * @param callBack
     */
    this.pay = function (params, id, type, callBack) {
        if (typeof WeixinJSBridge == "undefined") {
            if (document.addEventListener) {
                document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
            } else if (document.attachEvent) {
                document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
            }
        } else {
            onBridgeReady(params, id, type, callBack);
        }
    };

    return self;
};

var ocean_banner = function (elem) {
    new Swiper(elem, {
        autoplay: 3000,
        speed: 1000,
        autoplayDisableOnInteraction: false,
        loop: true,
        centeredSlides: true,
        slidesPerView: 1,
        calculateHeight: true,
        initialSlide: 0,
        spaceBetween: 10,
        followFinger: false,
        pagination: '.swiper-pagination',
        passiveListeners: false,
        preventClicks: true,
        breakpoints: {
            300: {
                slidesPerView: 1
            }
        },

        onTap: function (data, event) {
            var item = $(".swiper-slide")[data.activeIndex];
            console.log(item);
            if ($(item).hasClass("type_book")) {
                location.href = "book_detail.html?id=" + $(item).data("id");
            } else if ($(item).hasClass("type_url")) {
                var url = $(item).data("id");
                if (url.indexOf("http://") == -1 && url.indexOf("https://") == -1) {
                    url = "http://" + url;
                }
                window.open(url);
            } else if ($(item).hasClass("type_message")) {
                location.href = "message.html?id=" + $(item).data("id");
            }
        }
    });
};

var ocean_jssdk = function (onReady) {
    var self = this;

    this.init = function () {
        ocean.get("resources/biz/wx/jssdk", {
            url: location.href
        }, function (res) {
            if (res.code == 0) {
                initWx(res.data);
            }
        });
        return self;
    };

    this.scanIsbn = function (callBack) {
        if (debug) {
            callBack('9787508681078');
            return;
        }
        wx.scanQRCode({
            needResult: 1,
            scanType: ["qrCode", "barCode"],
            success: function (res) {
                var result = res.resultStr;
                var isbn = result.substring(result.indexOf(",") + 1);
                callBack(isbn);
            }
        });
    };

    function initWx(data) {
        wx.config({
            debug: false,
            appId: data.appId,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature,
            jsApiList: [
                'checkJsApi',
                'scanQRCode',
                'onMenuShareTimeline',
                'onMenuShareAppMessage',
                'onMenuShareQQ',
                'onMenuShareWeibo',
                'hideMenuItems',
            ]
        });

        wx.ready(function () {
            console.log("jsSdk init success");
            try {
                onReady()
            } catch (e) {
            }
        });

        wx.error(function (res) {
            console.error(res);
        });
    }

    return self;
};

function judgeLogin(callback) {
    console.log("openid_cookie_key",localStorage.getItem(openid_cookie_key))
    var isLoginPage = window.location.href.indexOf('login.html') > -1;
    var isNoLoginPage = window.location.href.indexOf('register.html') > -1 || window.location.href.indexOf('common_select.html') > -1 || window.location.href.indexOf('index.html') > -1|| window.location.href.indexOf('my.html') > -1;
    if (!(isLoginPage || isNoLoginPage) && localStorage.getItem("ocean-follow-user") == null) {
    // if (!(isLoginPage || isNoLoginPage)) {
        ocean.post("api/check_login", {openId: localStorage.getItem(openid_cookie_key)}, function (res) {
            console.error(res)
            if (res.code == 0) {
                localStorage.setItem("ocean-follow-user", JSON.stringify(res.data));
                localStorage.setItem("ocean-follow-biz-code", res.data.bizIdentity || res.data.parentBizIdentity || "A1035554");
                if (null != callback)
                    callback();
            } else {
                localStorage.setItem("login-redirect-uri", location.href);
                window.location.href = ctxPath + 'login.html';
            }
        });
    } else {
        if (null != callback)
            callback();
    }
}

var cookie = new ocean_cookie();
var ocean = new ocean_core(cookie);

if (!debug && localStorage.getItem(openid_cookie_key) == null) {
    var code = ocean.getRequestParameter("code");
    if (code == null) {
        var from_url = location.href;
        var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + appid + '&redirect_uri=' + encodeURIComponent(from_url) + '&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect';
        location.href = url;
    } else {
        ocean.get("api/wx/detail", {code: code}, function (res) {
            localStorage.setItem(openid_cookie_key, res.data.openid);
            localStorage.setItem(wx_user_cookie_key, JSON.stringify(res.data));
            judgeLogin();
        })
    }
}

if (debug || localStorage.getItem(wx_user_cookie_key)) {
    judgeLogin();
}

/**
 * 动态加载动态加载CSS和JS文件
 * @type {{css: dynamicLoading.css, js: dynamicLoading.js}}
 */
var dynamicLoading = {
    css: function (path) {
        if (!path || path.length === 0) {
            throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.href = path + '?v=' + timestamp;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        head.appendChild(link);
    },
    js: function (path) {
        if (!path || path.length === 0) {
            throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = path + '?v=' + timestamp;
        script.type = 'text/javascript';
        head.appendChild(script);
    }
}
