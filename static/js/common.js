var record_countdown = sessionStorage.getItem("record_countdown");

$(".common_clearBtn").click(function () {
    $(this).prev().val("");
    $(this).css("display", "none");
})

$('.common_input').bind('input propertychange', function () {
    if ($(this).val() != "") {
        $(this).next().css("display", "inline-block");
    } else {
        $(this).next().css("display", "none");
    }
});

/**
 * 倒计时
 * @param em 获取验证码的元素
 * @param isjudge 是否为进入页面的判断
 */
function countDown(em, isjudge) {
    // console.log("--------------", record_countdown)
    if (!(isjudge && (record_countdown == null || record_countdown == "null" || record_countdown == 1))) {
        if (record_countdown != null && record_countdown != "null" && record_countdown != 1) {
            record_countdown = sessionStorage.getItem("record_countdown");
        } else {
            record_countdown = 60;
        }
        $(em).text(record_countdown + 's');
        var setTimer = setInterval(function () {
            if (record_countdown == 1) {
                $(em).text('重新获取');
                clearInterval(setTimer);
            } else {
                record_countdown--
                $(em).text(record_countdown + 's');
            }
        }, 1000)
    } else {
        $(em).text('获取验证码');
    }
}

//获取验证码
function getCodeEvent(em, id) {
    if ($(em).text() == "获取验证码" || $(em).text() == "重新获取") {
        var phone = $("#" + id).val();
        var pattern = /^1[34578]\d{9}$/;
        if (!pattern.test(phone)) {
            ocean.tip("手机号码不正确");
            return;
        }
        var loading = weui.loading('loading');
        ocean.get('api/verify/code', {phone: phone}, function (res) {
            loading.hide();
            if (res.code == 0) {
                countDown(em, false);
            }
        });
    }
}

/**
 * 金额格式(8000-->8,000.00)
 * @param num
 * @returns {string}
 */
function toThousands(num) {
    var result = '', counter = 0;
    num = (num || 0).toString();
    for (var i = num.length - 1; i >= 0; i--) {
        counter++;
        result = num.charAt(i) + result;
        if (!(counter % 3) && i != 0) {
            result = ',' + result;
        }
    }
    return result + '.00';
}