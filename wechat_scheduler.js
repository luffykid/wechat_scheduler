const appName = '微信';
const contactName = 'pub';
const pinCode = '1412';
const albumCount = 1;

wakeUpAndUnlockByPinCode(pinCode);
sleep(1000)
closeApp(appName)
sleep(1000)
app.launchApp(appName);
sleep(3000);
openChatPage(contactName);

selectAlbumAndSend(albumCount);

function closeApp(appName) {
    const packageName = app.getPackageName(appName);
    app.openAppSetting(packageName);
    sleep(1000);
    const terminalAppButton = desc('结束运行').findOne();
    if (!terminalAppButton || !terminalAppButton.enabled()) {
        return;
    }
    terminalAppButton.click()
    sleep(1000);
    const confirmTerminalAppButton = text('确定').findOne();
    if (!confirmTerminalAppButton) {
        return;
    }
    const result = confirmTerminalAppButton.click();
    log(result ? `结束${appName}成功` : `结束${appName}失败`)
}

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

    const contact = className('android.widget.TextView').text(contactName).findOne()
    if (!contact) {
        return;
    }
    let clickableWidget = contact;
    for (let i = 0; i < 5; i++) {
        clickableWidget = clickableWidget.parent()
    }
    clickableWidget.click()
}

function selectAlbumAndSend(albumCount) {
    const moreFunctionButton = desc('更多功能按钮，已折叠').findOne();
    if (!moreFunctionButton) {
        return;
    }
    moreFunctionButton.click();
    sleep(2000)
    const gridView = className('android.widget.GridView').id('a1u').findOne();
    if (!gridView) {
        return;
    }
    const children = gridView.children();
    for (let child of children) {
        const textView = child.findOne(text('相册'))
        if (!textView) {
            continue;
        }
        click(child.bounds().centerX(), child.bounds().centerY())
        sleep(3000)
        break;
    }
    const imageWrapers = id('root_view').find();

    let seletctedCount = 0;
    for(let imageWidget of imageWrapers) {
        if(albumCount <= seletctedCount) {
            break;
        }
        let checkBox = imageWidget.findOne(className('android.widget.CheckBox'));
        if (checkBox) {
            const selected = checkBox.click();
            seletctedCount = seletctedCount + (selected? 1: 0);
        }
    }
    log(`共选中了${seletctedCount}张图片`)
    const sendButton = textContains('发送').findOne();
    if(!sendButton) {
        return;
    }
    sendButton.click();
}

function wakeUpAndUnlockByPinCode(pinCode) {
    device.wakeUpIfNeeded();
    sleep(1000);
    /**
     * 向上滑动屏幕
     */
    const x = device.width / 2;
    const startY = device.height / 8 * 7;
    const endY = device.height / 8;
    swipe(x, startY, x, endY, 1000);
    sleep(1000)
    for(let code of pinCode) {
        click(code)
    }
    log('屏幕已经唤醒')
}

