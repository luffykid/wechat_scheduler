"ui";

const storageName = 'wechat_scheduler_v1_1';
const autojsStorage = storages.create(storageName);
const storage = {
    setTime(time) {
        autojsStorage.put('time', time);
    },
    getTime() {
        return autojsStorage.get('time', {
            hour: 2,
            minute: 30
        });
    },
    setImageCount(imageCount) {
        autojsStorage.put('imageCount', imageCount);
    },
    getImageCount() {
        return autojsStorage.get('imageCount', 10);
    },
    setGroupName(groupName) {
        autojsStorage.put('groupName', groupName);
    },
    getGroupName() {
        return autojsStorage.get('groupName');
    },
    setPinCode(pinCode) {
        autojsStorage.put('pinCode', pinCode);
    },
    getPinCode() {
        return autojsStorage.get('pinCode');
    },
    setTask(task) {
        autojsStorage.put('task', task);
    },
    getTask() {
        const task = autojsStorage.get('task')
        if (task) {
            task.dateTime = new Date(task.dateTime)
        }
        return task;
    },
    setTimerId(timerId) {
        autojsStorage.put('timerId', timerId);
    },
    getTimerId() {
        return autojsStorage.get('timerId');
    },
    removeTimerId() {
        autojsStorage.remove('timerId');
    }
}
const config = {
    appName: '微信',
    waitForFindOne: 5000,
    waitForOpenApp: 10000,
    maxClickCount: 5
}

main();

function main() {
    ui.layout(
        <vertical>
            <appbar>
                <toolbar id='toolbar' title='微信定时任务设置'></toolbar>
            </appbar>
            <vertical padding="16">
                <vertical marginBottom='12'>
                    <text text='请输入消息发送时间'></text>
                    <horizontal>
                        <input id='hourOfTime' w='100' inputType="number"></input>
                        <text text='时'></text>
                        <input id='minuteOfTime' w='100' inputType="number"></input>
                        <text text='分'></text>
                    </horizontal>
                </vertical>

                <vertical marginBottom='12'>
                    <text text='发送多少张图片'></text>
                    <input id='imageCount' inputType="number" hint='想要发送的图片数量'></input>
                </vertical>

                <vertical marginBottom='12'>
                    <text text='发送到哪个微信群'></text>
                    <input id='groupName' hint='请输入群名称'></input>
                </vertical>

                <vertical marginBottom='12'>
                    <text text='锁屏密码(4位)'></text>
                    <input id='pinCode' inputType="number" hint='请填写手机锁屏密码'></input>
                </vertical>
                <vertical marginTop='24'>
                    <text id='tip' textColor="red" textSize="12sp" textStyle='bold'></text>
                    <button h='64' style="Widget.AppCompat.Button.Colored" id="enableTask" text="确定开启任务" />
                    <button h='64' id="disableTask" text="关闭任务" />
                </vertical>
            </vertical>
        </vertical>
    )
    initWidgetValue();
    enableScheduleTask();

    ui.enableTask.click(() => {
        let hour = ui.hourOfTime.text();
        if (!hour) {
            toast('请输入小时');
            return;
        }
        hour = parseInt(hour, 10);
        if (hour < 0 || hour > 23) {
            toast('无效的小时数，请输入0～23')
            return;
        }
        let minute = ui.minuteOfTime.text();
        if (!minute) {
            toast('请输入分钟');
            return;
        }
        minute = parseInt(minute, 10);
        if (minute < 0 || minute > 59) {
            toast('无效的小时数，请输入0～59')
            return;
        }
        let imageCount = ui.imageCount.text();
        if (!imageCount) {
            toast('请输入1～20的图片数量')
            return;
        }
        imageCount = parseInt(imageCount, 10);

        const groupName = ui.groupName.text();
        if (!groupName || groupName.length === 0) {
            toast('请输入群名称')
            return;
        }

        const pinCode = ui.pinCode.text();
        log('pinCode:' + pinCode);
        if (!pinCode || !/^\d{4}$/.test(pinCode)) {
            toast('请输入4位锁屏密码')
            return;
        }

        storage.setTime({
            hour, minute
        });
        storage.setImageCount(imageCount);
        storage.setGroupName(groupName);
        storage.setPinCode(pinCode);

        let now = new Date();
        let taskTime;
        if (now.getHours() <= hour && now.getMinutes() < minute) {
            taskTime = new Date(now);
            taskTime.setHours(hour, minute, 0, 0);
        } else {
            let tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            taskTime = tomorrow;
            tomorrow.setHours(hour, minute, 0, 0);
        }
        const task = {
            enabled: true,
            dateTime: taskTime,
            status: '待执行'
        }
        storage.setTask(task);
        updateUiTipText();
        scheduleTask();
    });
    ui.disableTask.click(() => {
        const task = storage.getTask();
        task.enabled = false;
        storage.setTask(task);
        const timerId = storage.getTimerId();
        clearTimeout(timerId);
        storage.removeTimerId();
        updateUiTipText();
        log('任务已经关闭')
    });
}

function initWidgetValue() {
    let time = storage.getTime();
    ui.hourOfTime.setText(time.hour + '');
    ui.minuteOfTime.setText(time.minute + '');

    let imageCount = storage.getImageCount();
    ui.imageCount.setText(imageCount + '');
    log(imageCount)

    let groupName = storage.getGroupName();
    log(groupName)
    if (groupName) {
        ui.groupName.setText(groupName);
    }

    let pinCode = storage.getPinCode();
    if (pinCode) {
        ui.pinCode.setText(pinCode);
    }

    updateUiTipText();
}

function enableScheduleTask() {
    const task = storage.getTask();
    if (task) {
        const now = new Date();
        if (task.enabled && now.getTime() < task.dateTime.getTime()) {
            log('启动定时任务')
            scheduleTask();
        }
    }
}

function updateUiTipText() {
    let task = storage.getTask();
    if (task) {
        const dateTime = task.dateTime;
        const dateTimeString = `${dateTime.getMonth() + 1}月${dateTime.getDate()}日${dateTime.getHours()}时${dateTime.getMinutes()}分`;
        let tipText;
        if (task.enabled) {
            tipText = task.status === '已完成' ? `${dateTimeString}的任务已完成` : `已开启于${dateTimeString}执行的任务`
        } else {
            tipText = `已关闭于${dateTimeString}执行的任务`
        }
        ui.tip.setText(tipText);
    }
}

function scheduleTask() {
    const now = new Date();
    const task = storage.getTask();
    let delta = task.dateTime.getTime() - now.getTime();
    log(`${Math.ceil(delta / 1000 / 60)}分钟后执行`);
    let timerId = storage.getTimerId();
    if (timerId) {
        clearTimeout(timerId);
        storage.removeTimerId();
    }
    auto.setMode('fast');  // 启用快速模式
    auto.waitFor();
    threads.start(() => {
        timerId = setTimeout(() => {
            const pinCode = storage.getPinCode();
            wakeUpAndUnlockByPinCode(pinCode);

            const albumCount = storage.getImageCount();
            const contactName = storage.getGroupName();
            toast('开始执行微信定时任务，请勿操作手机');
            const maxTryCount = 10;
            let tryCount = 0;
            do {
                try {
                    sendAlbumToContact(albumCount, contactName);
                    break;
                } catch (error) {
                    log(error);
                    sleep(3000);
                    tryCount += 1;
                    log(`进行第${tryCount}次尝试执行发送${albumCount}张照片给指定联系人「${contactName}」`)
                }
            } while (tryCount < maxTryCount);
            const successful = tryCount < maxTryCount;
            if (!successful) {
                return;
            }
            const task = storage.getTask();
            task.status = '已完成';
            storage.setTask(task);
            ui.run(() => {
                updateUiTipText();
            });
        }, delta);
        storage.setTimerId(timerId);
    })
}

function sendAlbumToContact(albumCount, contactName) {
    toast(`正在关闭${config.appName}，请勿操作手机`);
    closeApp(config.appName);
    toast(`正在打开${config.appName}，请勿操作手机`);
    openApp(config.appName);
    toast(`正在打开「${contactName}」的聊天页面，请勿操作手机`);
    openChatPage(contactName);
    toast('正在打开相册，请勿操作手机');
    selectAlbumAndSend(albumCount);
    toast('发送完成，可以操作手机了');
}

function closeApp(appName) {
    log(`开始关闭${appName}`);
    const packageName = app.getPackageName(appName);
    if (!packageName) {
        throw new Error(`未找到${appName}对应的包名`);
    }
    const openAppSettingResult = app.openAppSetting(packageName);
    if (!openAppSettingResult) {
        throw new Error(`未找到${packageName}的设置页`);
    }
    const terminalAppButton = desc('结束运行').findOne(config.waitForFindOne);
    if (!terminalAppButton) {
        throw new Error('未找到结束运行按钮');
    }
    if (!terminalAppButton.enabled()) {
        log(`${appName}已关闭，直接返回`);
        return;
    }
    clickWidget(terminalAppButton, config.maxClickCount);
    const confirmTerminalAppButton = text('确定').findOne(config.waitForFindOne);
    if (!confirmTerminalAppButton) {
        throw new Error('未找到确认按钮');
    }
    clickWidget(confirmTerminalAppButton, config.maxClickCount)
    log(`关闭${appName}完成`);
}

function openApp(appName) {
    log(`开始启动${appName}`);
    const packageName = app.getPackageName(appName);
    app.launchPackage(packageName);
    let widget = text(appName).findOne(config.waitForOpenApp);
    if (!widget) {
        throw Error(`${appName}未在${config.waitForOpenApp}ms打开`);
    }
    log(`启动${appName}完成`);
}
/*
function openChatPage(contactName) {
    const searchButton = desc('搜索').findOne();
 
    if (!searchButton) {
        return
    }
    searchButton.click();
    sleep(1500);
 
    const searchTextEditWidget = className('android.widget.EditText').text('搜索').findOne();
 
    if (!searchTextEditWidget) {
        return;
    }
    searchTextEditWidget.setText(contactName);
    sleep(2000);
 
    let relativeLayouts = className('android.widget.RelativeLayout').find();
    for(let relativeLayout of relativeLayouts) {
        const textView = relativeLayout.findOne(text(contactName))
        if(textView) {
            log(`${contactName}存在`)
            log(relativeLayout.indexInParent())
            log(relativeLayout.clickable())
            click(relativeLayout.bounds().centerX(), relativeLayout.bounds().centerY());
            sleep(3000)
            break;
        }
    }
    
}*/

function openChatPage(contactName) {
    log(`开始打开${contactName}的聊天页面`);
    const widget = text(contactName).findOne(config.waitForFindOne);
    if (!widget) {
        throw new Error(`未找到${contactName}的聊天`);
    }
    clickWidget(widget, config.maxClickCount);
    log(`打开${contactName}的聊天页面完成`);
}

function selectAlbumAndSend(albumCount) {
    log('打开相册');
    const moreFunctionButton = desc('更多功能按钮，已折叠').findOne(config.waitForFindOne);
    if (!moreFunctionButton) {
        throw new Error('未找到更多功能按钮');
    }
    clickWidget(moreFunctionButton, config.maxClickCount);
    const gridView = className('android.widget.GridView').id('a1u').findOne(config.waitForFindOne);
    if (!gridView) {
        throw new Error('点击更多功能按钮后，并未展示更多功能');
    }
    const children = gridView.children();
    for (let child of children) {
        const textView = child.findOne(text('相册'));
        if (textView) {
            clickWidget(child, config.maxClickCount);
            break;
        }
    }
    log(`开始选中前${albumCount}照片`)
    //判断相册页面是否打开
    const opened = !!(id('root_view').findOne(config.waitForFindOne));
    if (!opened) {
        throw new Error(`相册未在${config.waitForFindOne}ms内打开`);
    }
    const imageWrapers = id('root_view').find();
    let seletctedCount = 0;
    for (let imageWidget of imageWrapers) {
        if (albumCount <= seletctedCount) {
            break;
        }
        let checkBox = imageWidget.findOne(className('android.widget.CheckBox'));
        if (!checkBox) {
            break;
        }
        clickWidget(checkBox, config.maxClickCount);
        seletctedCount += 1;
    }
    log(`共选中了${seletctedCount}张图片`);
    if (seletctedCount !== albumCount) {
        throw new Error(`只选中了${seletctedCount}张图片，没有达到预期的${albumCount}张图片`);
    }
    log('开始发送');
    const sendButton = textContains('发送').findOne(config.waitForFindOne);
    if (!sendButton) {
        throw new Error('在相册页面未找到发送按钮');
    }
    clickWidget(sendButton, config.maxClickCount);
    sleep(1500);
    log('发送完成');
}

function wakeUpAndUnlockByPinCode(pinCode) {
    if (device.isScreenOn()) {
        return;
    }
    const maxTryCount = 10;
    let tryCount = 0;
    do {
        log('唤醒屏幕');
        device.wakeUp();
        sleep(1000);
        //向上滑动屏幕
        const x = device.width / 2;
        const startY = device.height / 8 * 7;
        const endY = device.height / 8;
        log('向上滑动屏幕');
        swipe(x, startY, x, endY, 1000);
        sleep(1000);
        //输入pin
        let result = true;
        for(let code of pinCode) {
            result = click(code) && result;
        }
        if (result) {
            log('屏幕已解锁');
            return;
        }
        log('休息20s后再试')
        sleep(20000);
        tryCount += 1;
    } while (tryCount < maxTryCount);
    throw new Error('未能唤醒并解锁屏幕');
}

function clickWidget(widget, maxTryCount) {
    maxTryCount = maxTryCount > 1? maxTryCount : 1;
    if (!widget) {
        throw new Error('组件禁止为空');
    }
    if (maxTryCount < 1) {
        throw new Error('maxTryCount必须大于0');
    }
    let successful = widget.click() || click(widget.bounds().centerX(), widget.bounds().centerY());
    if (!successful) {
        let tryCount = 0;
        do {
            successful = widget.click() || click(widget.bounds().centerX(), widget.bounds().centerY());
            if (successful) {
                log(`尝试第${tryCount}成功`);
                return;
            }
            tryCount += 1;
        } while (tryCount < maxTryCount);
        throw new Error(`尝试${tryCount}次后依旧失败`);
    }
}