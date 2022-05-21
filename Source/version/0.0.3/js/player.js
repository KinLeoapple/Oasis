//---------------------------- 定义变量 ----------------------------//

let list = [];
let isEmpty = false;
let audioList = [];
let random = [];
let lyricsTiming = [];
let lineHeight = [];
let loadedNetAudio = [];
let languageList = [];
let netAudioList = [];
let language = '';
let currentLyricsLine = 0;
let isInit = false;
let isPlay = false;
let isPlaying = false;
let isMute = false;
let volumeNumber = 0.2;
let volume_left = 100 * volumeNumber;
let process_left = 0;
let processPerSecond;
let isVolumeClick = false;
let isProcessClick = false;
let currentListIndex = -1;
let loopMode = 0; // 0: 列表循环, -1: 单曲, 1: 随机
let audio = [];
let audioIndex = 0;
let isLibrary = true;
let maxPage = 0;
let searchIsChange = false;
let currentListPage = 0;
let currentID = -1;
let isConfig = false;
let isNet = false;
let offlineCount = 0;
let playlist_scrollbar;
let settinglist_scrollbar;
let settingpanel_scrollbar;

//---------------------------- 全局初始化 ----------------------------//

$(document).ready(function () {
    $('#setting-page').hide();
    $('.search_btn').html(SvgImage.searchSvg());
    $('#delete').html(SvgImage.deleteSvg());
    $('#download').hide();
    $('#download').html(SvgImage.downloadSvg());
    $('#list_loop').html(SvgImage.listLoopSvg());
    $('#single_loop').html(SvgImage.singleLoopSvg());
    $('#random_loop').html(SvgImage.randomLoopSvg());
    $('#last').html(SvgImage.lastSvg());
    $('#main_btn').html(SvgImage.playSvg());
    $('#next').html(SvgImage.nextSvg());
    $('#unmute_icon').html(SvgImage.unmuteSvg());
    $('#mute_icon').html(SvgImage.muteSvg());
    $('#setting').hide();
    $('#setting').html(SvgImage.settingSvg());
    $('#setting_back_icon').html(SvgImage.backSvg());
    $('#language_icon').html(SvgImage.switchLanguageSvg());
    $('#skin_icon').html(SvgImage.switchThemeSvg());
    $('#about_icon').html(SvgImage.aboutSvg());
    $('#multi_version').hide();
    $('#multi_version_icon').html(SvgImage.multiVersionSvg());
    playlist_scrollbar = new PerfectScrollbar('#list_content');
    topBarButtonsInit();
    settingSidePanelInit();
    checkIsOnline();
});

//---------------------------- 检查后台是否已经上线 ----------------------------//

function checkIsOnline() {
    axios({
        url: 'http://localhost:23456/CheckIsOnline',
        method: 'POST'
    })
        .then(res => {
            console.log(res);
            $.ajax({
                url: 'http://localhost:23456/GetConfig',
                type: 'GET',
                dataType: 'json',
                async: false,
                success: function (res) {
                    let json = JSON.stringify(res);
                    json = eval('(' + json + ')');
                    language = json.lang;
                    console.log(language)
                    if (language === 'EN') {
                        languageList = languageLib.getEN();
                    } else {
                        languageList = languageLib.getCN();
                    }
                    setLanguage();
                    settinglist_scrollbar = new PerfectScrollbar('#setting_list');
                }
            })
            $('#search_content input').val('');
            $('#loading').fadeOut(200);
            setTimeout(function () {
                $('#loading').css('z-index', '-1');
            }, 200);
            sourceInit();
            playerInit();
            if (!isEmpty) {
                playListInit();
                $.onListClick();
            } else {
                searchBar();
                $.onListClick();
            }
            topOptionBtn();
            controlBarInit();
            isInit = true;
            getConfig();
            $('#setting').show();
            return true;
        })
        .catch(function (error) {
            console.log(error);
            if (offlineCount < 20) {
                offlineCount++;
                setTimeout(function () {
                    checkIsOnline();
                }, 1000);
            } else {
                // 服务器启动失败
                console.log('Server launch failed, app is closing!');
            }
        });
}

function setLanguage() {
    $('#library').html(languageList[0]);
    $('#net').html(languageList[1]);
    if (!isLibrary) {
        $('#search_content input').attr('placeholder', languageList[3] + '...');
    } else if (isLibrary) {
        $('#search_content input').attr('placeholder', languageList[2] + '...');
    }
    $('#close').attr('title', languageList[17]);
    $('#min').attr('title', languageList[18]);
    $('#more_artist_tip').html(languageList[8]);
    $('#more_album_tip').html(languageList[9]);
    $('#delete').attr('title', languageList[10]);
    $('#list_loop').attr('title', languageList[12]);
    $('#single_loop').attr('title', languageList[13]);
    $('#random_loop').attr('title', languageList[14]);
    $('#last').attr('title', languageList[15]);
    $('#next').attr('title', languageList[16]);
    $('#download').attr('title', languageList[11]);
    $('#setting').attr('title', languageList[20]);
    $('#setting_title span').html(languageList[20]);
    $('#language_text span').html(languageList[21]);
    $('#switch_language').html(languageList[21]);
    $('#skin_text span').html(languageList[22]);
    $('#about_text span').html(languageList[23]);
    $('#share').attr('title', languageList[24]);
    $('#multi_version_icon').attr('title', languageList[25]);
}

//---------------------------- 播放器 ----------------------------//

// 播放器初始化
function playerInit() {
    getList();
}

function getConfig() {
    $.ajax({
        url: 'http://localhost:23456/GetConfig',
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function (res) {
            let json = JSON.stringify(res);
            json = eval('(' + json + ')');
            let id = json.currentID;
            if (!isEmpty) {
                loopMode = parseInt(json.loopMode);
            } else {
                loopMode = -1;
            }
            if (loopMode === 0) {
                $('#list_loop').show();
                $('#random_loop').hide();
                $('#single_loop').hide();
            } else if (loopMode === 1) {
                $('#list_loop').hide();
                $('#random_loop').show();
                $('#single_loop').hide();
            } else {
                $('#list_loop').hide();
                $('#random_loop').hide();
                $('#single_loop').show();
            }
            if (id === '-1') {
                id = '26608789'
            }
            axios({
                url: 'http://localhost:23456/CheckIsLocal',
                method: 'GET',
                params: {id: id}
            }).then(respond => {
                Promise.resolve(respond.data).then(res => {
                    volume_left = json.volume;
                    $('#volume_icon').off('click');
                    $(document).off('mouseup');
                    $(document).off('mousemove');
                    $('#process_btn' + audioIndex).off('mousedown');
                    $('#volume_btn').off('mousedown');
                    $("#main_btn").off('click');
                    $(document).off('keydown');
                    $('#process_btn' + audioIndex).css('margin-left', '-5px');
                    $('#current' + audioIndex).css('width', '0px');
                    $('#loop').off('click');
                    if (res.toString() !== 'false') {
                        isNet = false;
                        $('#list_playing_icon_' + currentListIndex).hide();
                        currentListIndex = list.indexOf(res);
                        setAudio(currentListIndex, true);
                        if (isPlay) {
                            $('#list_playing_icon_' + currentListIndex).css('animation', 'rotate 5s linear infinite');
                        } else {
                            $('#list_playing_icon_' + currentListIndex).css('animation', 'none');
                        }
                        $('#list_playing_icon_' + currentListIndex).show();
                    } else {
                        isNet = true;
                        $('#list_playing_icon_net_' + currentID).hide();
                        currentID = id;
                        axios({
                            url: 'http://localhost:23456/GetNetAudioInfo',
                            method: 'GET',
                            params: {id: id},
                            type: 'json'
                        }).then(respond => {
                            Promise.resolve(respond.data).then(res => {
                                let json = JSON.stringify(res);
                                json = eval('(' + json + ')');
                                document.getElementById('title').innerHTML = json.name;
                                document.getElementById('title').title = json.name;
                                document.getElementById('artist').innerHTML = json.artist;
                                document.getElementById('artist').title = json.artist;
                                $('#current_song').html(document.getElementById('title').innerHTML + ' - ' + document.getElementById('artist').innerHTML);
                                $('title').html(document.getElementById('artist').innerHTML + ' - ' + document.getElementById('title').innerHTML);
                            });
                        });
                        setAudio(id, false);
                        if (isPlay) {
                            $('#list_playing_icon_net_' + currentID).css('animation', 'rotate 5s linear infinite');
                        } else {
                            $('#list_playing_icon_net_' + currentID).css('animation', 'none');
                        }
                        $('#list_playing_icon_net_' + currentID).show();
                    }
                    audio[0].currentTime = parseFloat(json.process);
                    setCurrent(audio[0]);
                });
            });
            isConfig = true;
        }
    });
}

function getList() {
    list = [];
    $.ajax({
        type: 'GET',
        url: 'http://localhost:23456/GetLibraryList',
        dataType: 'json',
        async: false,
        success: function (res) {
            let json = JSON.stringify(res);
            json = eval('(' + json + ')');
            let i = 0;
            for (var p in json) {
                list[i] = json[p];
                i++;
            }
            list.sort();
            if (i === 0) {
                isEmpty = true;
            } else {
                isEmpty = false;
            }
        }
    });
}

function getAudioInfo(number) {
    $.ajax({
        type: 'GET',
        url: 'http://localhost:23456/GetAudioInfo',
        data: {'mp3': list[number]},
        dataType: 'json',
        async: false,
        success: function (res) {
            let json = JSON.stringify(res);
            json = eval('(' + json + ')');
            let map = new Map();
            map.set('duration', json.duration);
            map.set('artist', json.artist);
            map.set('title', json.title);
            audioList[number] = map;
        }
    });
}

//---------------------------- 控制栏 ----------------------------//

// 初始化控制栏
function controlBarInit() {
    $("#main_btn").hover(function () {
        $("#main_btn path").attr('fill', '#8a8a8a');
    }, function () {
        $("#main_btn path").attr('fill', '#e6e6e6');
    });
    if (!isEmpty) {
        lastBtn();
        nextBtn();
    }
    if (volumeNumber <= 0) {
        isMute = true;
        $('#mute_icon').show();
        $('#unmute_icon').hide();
    } else {
        isMute = false;
        $('#unmute_icon').show();
        $('#mute_icon').hide();
    }
    $('#process_btn' + audioIndex).css('margin-left', '-5px');
    downloadBtn();
}

function setAudio(number, isLocal) {
    createProcessBar();
    audio[0] = new Audio();
    if (isInit) {
        if (isLocal) {
            if (isNaN(number)) {
                number = 0;
            }
            $.ajax({
                url: 'http://localhost:23456/GetAudio',
                type: 'GET',
                data: {
                    mp3: list[number]
                },
                async: true,
                beforeSend: function () {
                    clearInterval(processPerSecond);
                    $('#multi_version').hide();
                    $('#main_btn').off('click');
                    $(document).off('keydown');
                    $('#main_btn').css('cursor', 'no-drop');
                    document.getElementById('title').innerHTML = languageList[4] + '...';
                    document.getElementById('artist').innerHTML = '';
                    $('#time' + audioIndex).html('--:--:--');
                    $('#current_song').html(languageList[4] + '...');
                    $('#download').hide();
                    $('#list_playing_icon_' + currentListIndex).hide();
                    $('#list_playing_icon_' + currentListIndex).css('animation', 'none');
                    $('#list_playing_icon_net_' + currentID).hide();
                    $('#list_playing_icon_net_' + currentID).css('animation', 'none');
                },
                complete: function (res) {
                    audio[0].src = res.responseText.toString();
                    audio[0].load();
                    audio[0].oncanplaythrough = function () {
                        try {
                            $('#time' + audioIndex).html(setTime(audio[0].duration - audio[0].currentTime));
                        } catch (e) {
                        }
                        $('#bar_show' + audioIndex).html(setTime(audio[0].currentTime));
                    };
                    const tags = audioList[number];
                    document.getElementById('title').innerHTML = tags.get('title') === 'null' ? list[number].substring(0, list[number].lastIndexOf('.')) : tags.get('title');
                    document.getElementById('title').title = tags.get('title') === 'null' ? list[number].substring(0, list[number].lastIndexOf('.')) : tags.get('title');
                    document.getElementById('artist').innerHTML = tags.get('artist') === 'null' ? languageList[5] : tags.get('artist');
                    document.getElementById('artist').title = tags.get('artist') === 'null' ? languageList[5] : tags.get('artist');

                    $('#main_btn').css('cursor', 'pointer');
                    mainBtn(audio[0]);
                    $('#current_song').html(document.getElementById('title').innerHTML + ' - ' + document.getElementById('artist').innerHTML);
                    // onAudioEnded();
                    $('title').html(list[number].substring(0, list[number].lastIndexOf('.')));

                    axios({
                        url: 'http://localhost:23456/GetAudioID',
                        method: 'GET',
                        params: {mp3: list[number]}
                    }).then(respond => {
                        Promise.resolve(respond.data).then(res => {
                            currentID = res;
                        });
                    });
                    axios({
                        url: 'http://localhost:23456/GetAudioPicture',
                        method: 'POST',
                        data: {mp3: list[number]}
                    }).then(respond => {
                        Promise.resolve(respond.data).then(res => {
                            if (res !== 'null') {
                                adjustPicture(res);
                            } else {
                                adjustPicture('./img/default_cover.jpeg');
                            }
                        });
                    });
                    afterComplete();
                }
            });
        } else {
            $.ajax({
                url: 'http://localhost:23456/GetNetAudio',
                type: 'GET',
                data: {
                    id: number
                },
                dataType: 'json',
                async: true,
                beforeSend: function () {
                    clearInterval(processPerSecond);
                    $('#multi_version').hide();
                    netAudioList = [];
                    $('#main_btn').off('click');
                    $(document).off('keydown');
                    $('#main_btn').css('cursor', 'no-drop');
                    document.getElementById('title').innerHTML = languageList[4] + '...';
                    document.getElementById('artist').innerHTML = '';
                    $('#time' + audioIndex).html('--:--:--');
                    $('#current_song').html(languageList[4] + '...');
                    $('#download').hide();
                    $('#list_playing_icon_' + currentListIndex).hide();
                    $('#list_playing_icon_' + currentListIndex).css('animation', 'none');
                },
                complete: function (res) {
                    if (res.responseText.toString() !== 'null') {
                        let json = JSON5.parse(res.responseText.toString());
                        netAudioList = json.urls;
                        if (netAudioList.length > 0) {
                            if (netAudioList.length > 1) {
                                $('#multi_version').show();
                            }
                            audio[0].src = netAudioList[0].url;
                            audio[0].load();
                            audio[0].oncanplaythrough = function () {
                                try {
                                    $('#time' + audioIndex).html(setTime(audio[0].duration - audio[0].currentTime));
                                } catch (e) {
                                }
                                $('#bar_show' + audioIndex).html(setTime(audio[0].currentTime));
                            };
                            $('#main_btn').css('cursor', 'pointer');
                            mainBtn(audio[0]);
                        } else {
                            $('#time' + audioIndex).html(languageList[19]);
                            $('#bar_show' + audioIndex).html(setTime(0));
                        }
                        axios({
                            url: 'http://localhost:23456/CheckIsLocal',
                            method: 'GET',
                            params: {id: number}
                        }).then(respond => {
                            Promise.resolve(respond.data).then(res => {
                                if (res.toString() === 'false') {
                                    $('#download').show();
                                }
                            });
                        });
                    } else {
                        $('#time' + audioIndex).html(languageList[19]);
                        $('#bar_show' + audioIndex).html(setTime(0));
                    }
                    if ($('#net_title_' + number).html() != undefined) {
                        document.getElementById('title').innerHTML = $('#net_title_' + number).html();
                        document.getElementById('title').title = $('#net_title_' + number).html();
                    }
                    if ($('#net_artist_' + number).html() != undefined) {
                        document.getElementById('artist').innerHTML = $('#net_artist_' + number).html();
                        document.getElementById('artist').title = $('#net_artist_' + number).html();
                    }
                    if ($('#net_title_' + number).html() != undefined && $('#net_artist_' + number).html() != undefined) {
                        $('#current_song').html(document.getElementById('title').innerHTML + ' - ' + document.getElementById('artist').innerHTML);
                        $('title').html(document.getElementById('artist').innerHTML + ' - ' + document.getElementById('title').innerHTML);
                    }
                    // onAudioEnded();
                    axios({
                        url: 'http://localhost:23456/GetNetAudioPicture',
                        method: 'POST',
                        data: {
                            id: number
                        }
                    }).then(respond => {
                        Promise.resolve(respond.data).then(res => {
                            if (res !== 'null') {
                                adjustPicture(res);
                            } else {
                                adjustPicture('./img/default_cover.jpeg');
                            }
                        });
                    });
                    afterComplete();
                }
            });
        }
    }

    function afterComplete() {
        createSpectrum();
        audio[0].volume = 0;
        setVolume(audio[0]);
        process_left = 0;
        lyricsInit(number, audio[0], isLocal);
        onVolumeIconClick(audio[0]);
        volumeBtn(audio[0]);
        processBtn(audio[0]);
        $('#loop').off('click');
        $('#last').off('click');
        $('#next').off('click');
        if (!isEmpty) {
            $('#loop').css('cursor', 'pointer');
            $('#last').css('cursor', 'pointer');
            $('#next').css('cursor', 'pointer');
            loopBtn();
            lastBtn();
            nextBtn();
        } else {
            $('#loop').css('cursor', 'no-drop');
            $('#last').css('cursor', 'no-drop');
            $('#next').css('cursor', 'no-drop');
        }
        audio[0].oncanplay = function () {
            setCurrent(audio[0]);
            if (isPlaying) {
                isPlay = false;
                $("#main_btn").click();
            }
            axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
        }
    }

    audio[0].onended = function () {
        $('.list_playing').each(function () {
            $(this).css({'display': 'block', 'animation': 'none'});
        });
        if (loopMode === 0) {
            if (!isLocal) {
                currentListIndex = currentListIndex - 1;
            }
            $('#next').click();
        } else if (loopMode === -1) {
            $('#loop').off('click');
            loopBtn();
            audio[0].currentTime = 0;
            process_left = 0;
            lyricsInit(number, audio[0], isLocal);
            $('#process_btn' + audioIndex).css('margin-left', '-5px');
            $('#current' + audioIndex).css('width', '0px');
            $('#list_playing_icon_' + currentListIndex).css('animation', 'rotate 5s linear infinite');
            audio[0].play();
            setCurrent(audio[0]);
            $('#bar_show' + audioIndex).html(setTime(audio[0].currentTime));
            clearInterval(processPerSecond);
            let index = audioIndex;
            processPerSecond = setInterval(function () {
                axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
                setCurrent(audio[0]);
                $('#bar_show' + index).html(setTime(audio[0].currentTime));
                $('#time' + index).html(setTime(audio[0].duration - audio[0].currentTime));
            }, 1000);
        } else {
            $('#next').click()
        }
    }
}

// 创建频谱
function createSpectrum() {
    var wrap = document.getElementById("spectrum");
    var cxt = wrap.getContext("2d");
    var AudioContext = new (window.AudioContext || window.webkitAudioContext)();
    var source = AudioContext.createMediaElementSource(audio[0])
    var analyser = AudioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(AudioContext.destination);
    var output = new Uint8Array(180);
    var du = 2;//角度
    var potInt = {x: 225, y: 225};//起始坐标
    var R = 150;//半径
    var W = 3;//宽
    (function drawSpectrum() {
        analyser.getByteFrequencyData(output);//获取频域数据
        cxt.clearRect(0, 0, wrap.width, wrap.height);
        //画线条
        let hue = 90;
        let reverse = false;
        for (var i = 0; i < output.length; i++) {
            cxt.lineCap = "round";
            if (hue >= 180) reverse = true;
            if (reverse) {
                hue--;
            } else {
                hue++;
            }
            cxt.shadowColor = `hsl(${hue}, 100%, 50%)`;
            cxt.shadowBlur = 1;
            var value = output[i] / 10;//<===获取数据
            Rv1 = (R - value);
            Rv2 = (R + value);
            cxt.beginPath();
            cxt.arc((Math.sin((i * du) / 180 * Math.PI) * Rv1 + potInt.y), -Math.cos((i * du) / 180 * Math.PI) * Rv1 + potInt.x, 1, 0, 2 * Math.PI, false);
            cxt.fillStyle = `hsl(${hue}, 100%, 50%)`;
            cxt.fill();
            cxt.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            cxt.lineWidth = W;
            cxt.moveTo((Math.sin((i * du) / 180 * Math.PI) * Rv1 + potInt.y), -Math.cos((i * du) / 180 * Math.PI) * Rv1 + potInt.x);
            cxt.lineTo((Math.sin((i * du) / 180 * Math.PI) * Rv2 + potInt.y), -Math.cos((i * du) / 180 * Math.PI) * Rv2 + potInt.x);
            cxt.stroke();
        }
        cxt.fill();
        //请求下一帧
        requestAnimationFrame(drawSpectrum);
    })();
}

function downloadBtn() {
    $('#download').click(function () {
        axios({
            url: 'http://localhost:23456/DownloadAudio',
            method: 'POST',
            params: {id: currentID}
        }).then(respond => {
            Promise.resolve(respond.data).then(res => {
                if (res === 'finished') {
                    $('#download').hide();
                    getList();
                    for (let i = 0; i < list.length; i++) {
                        getAudioInfo(i);
                        axios({
                            url: 'http://localhost:23456/GetAudioID',
                            method: 'GET',
                            params: {mp3: list[i]}
                        }).then(respond => {
                            Promise.resolve(respond.data).then(res => {
                                if (res.toString() === currentID.toString()) {
                                    currentListIndex = i;
                                }
                            });
                        });
                    }
                    $('#loop').off('click');
                    $('#last').off('click');
                    $('#next').off('click');
                    if (!isEmpty) {
                        $('#loop').css('cursor', 'pointer');
                        $('#last').css('cursor', 'pointer');
                        $('#next').css('cursor', 'pointer');
                        loopBtn();
                        lastBtn();
                        nextBtn();
                    } else {
                        $('#loop').css('cursor', 'no-drop');
                        $('#last').css('cursor', 'no-drop');
                        $('#next').css('cursor', 'no-drop');
                    }
                    if (isLibrary) {
                        let content = $('#search_content input').val().toLocaleLowerCase();
                        if (content.length > 0) {
                            search(content);
                        } else {
                            setPlayList();
                        }
                    }
                }
            });
        });
    });
    $('#download').hover(function () {
        $('#download path').attr('fill', '#2a2a2a');
    }, function () {
        $('#download path').attr('fill', '#515151');
    });
}

function deleteBtn(id) {
    $('#delete').on('click', function () {
        axios({
            url: 'http://localhost:23456/DeleteAudio',
            method: 'GET',
            params: {id: id}
        }).then(respond => {
            Promise.resolve(respond.data).then(res => {
                if (res === 'finished') {
                    $('#delete').hide();
                    getList();
                    for (let i = 0; i < list.length; i++) {
                        getAudioInfo(i);
                    }
                    currentListIndex = currentListIndex - 1;
                    if (currentID.toString() === id.toString()) {
                        $('#download').show();
                    }
                    if (isLibrary) {
                        let content = $('#search_content input').val().toLocaleLowerCase();
                        if (content.length > 0) {
                            search(content);
                        } else {
                            setPlayList();
                        }
                    }
                }
            });
        });
    });
    $('#delete').hover(function () {
        $('#delete path').attr('fill', '#FF9966');
    }, function () {
        $('#delete path').attr('fill', '#FF6666');
    });
}

function loopBtn() {
    $('#loop').on('click', function () {
        axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
        if (loopMode === 0) {
            loopMode = 1;
            $('#list_loop').hide();
            $('#random_loop').show();
            $('#single_loop').hide();
        } else if (loopMode === 1) {
            loopMode = -1;
            $('#list_loop').hide();
            $('#random_loop').hide();
            $('#single_loop').show();
        } else {
            loopMode = 0;
            $('#list_loop').show();
            $('#random_loop').hide();
            $('#single_loop').hide();
        }
        return false;
    });
}

/*
音频按钮设置
 */
function setVolume(audio) {
    if (volume_left <= 0) {
        volume_left = 100 * 0.2;
    }
    $('#volume_btn').animate({marginLeft: (volume_left - 5) + 'px'}, 100);
    $('#current_volume').animate({width: volume_left + 'px'}, 100);
    volumeNumber = volume_left / 100;
    $(audio).animate({volume: volumeNumber / 3}, 500);
    $('#volume_show').html(parseInt((audio.volume * 300).toString()));
}

function onVolumeIconClick(audio) {
    $('#volume_icon').on('click', function () {
        if (isMute) {
            $('#unmute_icon').show();
            $('#mute_icon').hide();
            setVolume(audio);
        } else {
            $('#mute_icon').show();
            $('#unmute_icon').hide();
            $(audio).animate({volume: 0}, 500);
            $('#volume_btn').animate({marginLeft: '-5px'}, 100);
            $('#current_volume').animate({width: '0px'}, 100);
        }
        isMute = !isMute;
    });
    $('#volume_icon').hover(function () {
        $('#volume_show').fadeIn(100);
        $('#volume_show').html(parseInt((audio.volume * 300).toString()));
    }, function () {
        $('#volume_show').fadeOut(100);
    });
}

function volumeBtn(audio) {
    let ox = 0, left = 0;
    $('#volume_btn').on('mousedown', function (e) {
        let obj = e.srcElement || e.target;
        if (obj.id === 'volume_btn') {
            ox = e.pageX - volume_left;
            isVolumeClick = true;
            $('#volume_show').fadeIn(100);
            $('#volume_show').html(parseInt((audio.volume * 300).toString()));
        }
    });
    $(document).on('mouseup', function () {
        if (isVolumeClick) {
            volume_left = left;
            isVolumeClick = false;
            $('#volume_show').fadeOut(100);
            axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio.currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
        }
    });
    $(document).on('mousemove', function (e) {//鼠标移动
        if (isVolumeClick) {
            left = e.pageX - ox;
            if (left <= 0) {
                left = 0;
            } else if (left > 100) {
                left = 100;
            }
            $('#volume_btn').css('margin-left', (left - 5) + 'px');
            $('#current_volume').css('width', left + 'px');
            volumeNumber = left / 100;
            audio.volume = volumeNumber / 3;
            $('#volume_show').html(parseInt((audio.volume * 300).toString()));
            if (left <= 0) {
                isMute = true;
                $('#mute_icon').show();
                $('#unmute_icon').hide();
            } else {
                isMute = false;
                $('#unmute_icon').show();
                $('#mute_icon').hide();
            }
        }
    });
}

function findCloseNum(arr, num) {
    let index = 0; // 保存最接近数值在数组中的索引
    let d_value = Number.MAX_VALUE; // 保存差值绝对值，默认为最大数值
    for (let i = 0; i < arr.length; i++) {
        const new_d_value = Math.abs(arr[i] - num); // 新差值
        if (new_d_value <= d_value) { // 如果新差值绝对值小于等于旧差值绝对值，保存新差值绝对值和索引
            if (new_d_value === d_value && arr[i] < arr[index]) { // 如果数组中两个数值跟目标数值差值一样，取大
                continue;
            }
            index = i;
            d_value = new_d_value;
        }
    }
    return index; // 返回最接近的数值
}

function createProcessBar() {
    audioIndex = currentID + '';
    $("#control_bar .process_bar").remove();
    $("#control_bar").append("<div class=\"process_bar\">\n" +
        "            <div class=\"process\" id=\"process\">\n" +
        "                <div class=\"bar_show\" id=\"bar_show" + audioIndex + "\" style=\"width: 70px; margin-left: 570px; display: none;\"></div>\n" +
        "                <div class=\"current\" id=\"current" + audioIndex + "\"></div>\n" +
        "                <div class=\"process_btn\" id=\"process_btn" + audioIndex + "\"></div>\n" +
        "            </div>\n" +
        "            <div class=\"time\" id=\"time" + audioIndex + "\"></div>\n" +
        "        </div>");
}

/*
进度条设置
 */
function processBtn(audio) {
    let ox = 0, left = 0;
    $('#process_btn' + audioIndex).on('mousedown', function (e) {
        let obj = e.srcElement || e.target;
        if (obj.id === 'process_btn' + audioIndex) {
            clearInterval(processPerSecond);
            process_left = parseInt($('#current' + audioIndex).css('width'));
            ox = e.pageX - process_left;
            isProcessClick = true;
            $('#bar_show' + audioIndex).fadeIn(100);
        }
    });
    $(document).on('mouseup', function () {
        if (isProcessClick) {
            process_left = left;
            audio.currentTime = audio.duration * (left / 650);
            isProcessClick = false;
            setCurrent(audio);
            $('#bar_show' + audioIndex).html(setTime(audio.currentTime));
            clearInterval(processPerSecond);
            let index = audioIndex;
            processPerSecond = setInterval(function () {
                axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio.currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
                setCurrent(audio);
                $('#bar_show' + index).html(setTime(audio.currentTime));
                $('#time' + index).html(setTime(audio.duration - audio.currentTime));
            }, 1000);
            $('#bar_show' + audioIndex).fadeOut(100);

            currentLyricsLine = findCloseNum(lyricsTiming, audio.currentTime);
            const inner_lyrics = document.getElementById('inner_lyrics');
            let line = $('#line-' + currentLyricsLine);
            line.siblings().removeAttr('style');
            line.css({'color': '#1a1a1a', 'font-size': '18px', 'background-color': 'rgba(0,0,0,0.2)'});
            if (currentLyricsLine < 4) {
                inner_lyrics.scrollTo({top: 0, behavior: 'smooth'});
            } else {
                let total = 0;
                for (let i = 0; i <= currentLyricsLine - 4; i++) {
                    total += lineHeight[i] + 5;
                }
                inner_lyrics.scrollTo({
                    top: total,
                    behavior: 'smooth'
                });
            }
        }
        axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio.currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
    });
    $(document).on('mousemove', function (e) {//鼠标移动
        if (isProcessClick) {
            left = e.pageX - ox;
            if (left <= 0) {
                left = 0;
            } else if (left > 650) {
                left = 650;
            }
            $('#process_btn' + audioIndex).css('margin-left', (left - 5) + 'px');
            $('#current' + audioIndex).css('width', left + 'px');
            $('#bar_show' + audioIndex).html(setTime(audio.duration * (left / 650)));
        }
    });
}

/*
主按钮设置
 */
function mainBtn(audio) {
    function playControl() {
        let mainBtn = $("#main_btn");
        if (isPlay) {
            $('.list_playing').each(function () {
                $(this).children('div').css('animation', 'none');
            });
            $(audio).animate({volume: 0}, 500);
            setTimeout(function () {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // 这个时候可以安全的暂停
                        audio.pause();
                    }).catch(() => {
                    });
                }
            }, 500);
            mainBtn.html(SvgImage.playSvg());
            clearInterval(processPerSecond);
        } else {
            $('.list_playing').each(function () {
                $(this).children('div').css('animation', 'rotate 5s linear infinite');
            });
            audio.play();
            $(audio).animate({volume: volumeNumber / 3}, 500);
            mainBtn.html(SvgImage.stopSvg());
            setCurrent(audio);
            $('#bar_show' + audioIndex).html(setTime(audio.currentTime));
            clearInterval(processPerSecond);
            let index = audioIndex;
            processPerSecond = setInterval(function () {
                axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio.currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
                setCurrent(audio);
                $('#bar_show' + index).html(setTime(audio.currentTime));
                $('#time' + index).html(setTime(audio.duration - audio.currentTime));
            }, 1000);
        }
        isPlay = !isPlay;
    }

    $(document).on('keydown', function (e) {
        if (e.keyCode === 32) {
            playControl();
        }
    });
    $("#main_btn").on('click', playControl);
}

function setCurrent(audio) {
    let current = audio.currentTime / audio.duration * 100;
    $('#current' + audioIndex).css('width', current + '%');
    $('#process_btn' + audioIndex).css('margin-left', ($('#current' + audioIndex).width() - 5) + 'px');
    if (current >= 100) {
        $("#main_btn" + audioIndex).click();
    }
}

/*
上下首按钮设置
 */
function lastBtn() {
    $('#last').hover(function () {
        $('#last path').attr('fill', '#515151');
    }, function () {
        $('#last path').attr('fill', '#2a2a2a');
    });
    $('#last').click(function () {
        isPlaying = false;
        $('#list_playing_icon_' + currentListIndex).hide();
        if (loopMode === 1) {
            if (random.length === list.length) {
                random = [];
            }
            let randomNumber;
            for (; ;) {
                randomNumber = Math.floor(Math.random() * list.length - 1);
                if (!random.includes(randomNumber)) {
                    if (currentListIndex !== randomNumber) {
                        random[random.length] = randomNumber;
                        break;
                    }
                }
            }
            currentListIndex = randomNumber;
        } else {
            if (currentListIndex - 1 < 0) {
                currentListIndex = list.length;
            }
        }
        if (isPlay) {
            $("#main_btn").click();
            isPlaying = true;
        }
        $('#volume_icon').off('click');
        $(document).off('mouseup');
        $(document).off('mousemove');
        $('#process_btn' + audioIndex).off('mousedown');
        $('#volume_btn').off('mousedown');
        $("#main_btn").off('click');
        $(document).off('keydown');
        $('#process_btn' + audioIndex).css('margin-left', '-5px');
        $('#current' + audioIndex).css('width', '0px');
        $('#loop').off('click');
        loopBtn();
        if (loopMode !== 1)
            currentListIndex = currentListIndex - 1;
        setAudio(currentListIndex, true);
        if (isPlay) {
            $('#list_playing_icon_' + currentListIndex).css('animation', 'rotate 5s linear infinite');
        } else {
            $('#list_playing_icon_' + currentListIndex).css('animation', 'none');
        }
        $('#list_playing_icon_' + currentListIndex).show();
    });
}

function nextBtn() {
    $('#next').hover(function () {
        $('#next path').attr('fill', '#515151');
    }, function () {
        $('#next path').attr('fill', '#2a2a2a');
    });
    $('#next').click(function () {
        isPlaying = false;
        $('#list_playing_icon_' + currentListIndex).hide();
        if (loopMode === 1) {
            if (random.length === list.length) {
                random = [];
            }
            let randomNumber;
            for (; ;) {
                randomNumber = Math.floor(Math.random() * list.length - 1);
                if (!random.includes(randomNumber)) {
                    if (currentListIndex !== randomNumber) {
                        random[random.length] = randomNumber;
                        break;
                    }
                }
            }
            currentListIndex = randomNumber;
        } else {
            if (currentListIndex + 1 > list.length - 1) {
                currentListIndex = -1;
            }
        }
        if (isPlay) {
            $("#main_btn").click();
            isPlaying = true;
        }
        $('#volume_icon').off('click');
        $(document).off('mouseup');
        $(document).off('mousemove');
        $('#process_btn' + audioIndex).off('mousedown');
        $('#volume_btn').off('mousedown');
        $("#main_btn").off('click');
        $(document).off('keydown');
        $('#process_btn' + audioIndex).css('margin-left', '-5px');
        $('#current' + audioIndex).css('width', '0px');
        $('#loop').off('click');
        loopBtn();
        if (loopMode !== 1)
            currentListIndex = currentListIndex + 1;
        setAudio(currentListIndex, true);
        if (isPlay) {
            $('#list_playing_icon_' + currentListIndex).css('animation', 'rotate 5s linear infinite');
        } else {
            $('#list_playing_icon_' + currentListIndex).css('animation', 'none');
        }
        $('#list_playing_icon_' + currentListIndex).show();
    });
}

// 时间格式转换
function setTime(times) {
    let t;
    if (times > -1) {
        const hour = Math.floor(times / 3600);
        const min = Math.floor(times / 60) % 60;
        const sec = times % 60;
        if (hour < 10) {
            t = '0' + hour + ":";
        } else {
            t = hour + ":";
        }

        if (min < 10) {
            t += "0";
        }
        t += min + ":";
        if (sec < 10) {
            t += "0";
        }
        t += sec.toFixed(2);
    }
    return t.substring(0, t.length - 3);
}

// 调整图片显示位置
function adjustPicture(picture) {
    $('#picture').css('background-image', 'url(' + picture + ')');
}

//---------------------------- 播放列表 ----------------------------//

// 初始化播放列表
function playListInit() {
    setPlayList();
    searchBar();
}

function setPlayList() {
    $('#list_content').html('');
    for (let i = 0; i < list.length; i++) {
        let html = '';
        getAudioInfo(i);
        const tags = audioList[i];
        let title = tags.get('title') === 'null' ? list[i].substring(0, list[i].lastIndexOf('.')) : tags.get('title');
        let artist = tags.get('artist') === 'null' ? languageList[5] : tags.get('artist');
        $.ajax({
            url: 'http://localhost:23456/GetAudioID',
            method: 'GET',
            data: {mp3: list[i]},
            async: false,
            success: function (res) {
                html += '<div class="list" style="position: relative;" onclick="$.onListClick(' + i + ')">\n' +
                    '<div class="list_playing">\n';
                let style = '';
                if (currentID.toString() === res.toString()) {
                    if (isPlay) {
                        style += 'display: block; animation: rotate 5s linear infinite;';
                    } else {
                        style += 'display: block; animation: none;';
                    }
                    html += '<div id="list_playing_icon_' + i + '" style="' + style + '">';
                } else {
                    html += '<div id="list_playing_icon_' + i + '">';
                }
                html += SvgImage.playIconSvg();
                html += '</div>';
                html += '</div>\n' +
                    '<div class="list_info">\n' +
                    '<div class="list_title" id="local_title_' + i + '" title="' + title + '">' + title + '</div>\n' +
                    '<div class="list_artist" id="local_artist_' + i + '" title="' + artist + '">' + artist + '</div>\n' +
                    '</div>\n' +
                    '<div class="list_time" id="local_time_' + i + '">' + setTime(tags.get('duration')) + '</div>\n' +
                    '<div style="width: 100%; height: 100%; position: absolute;" id="' + res.toString() + '"></div>' +
                    '</div>';
                $('#list_content').html($('#list_content').html() + html);
                onAllListMouseHover(res.toString());
            }
        });
    }
    if (playlist_scrollbar) playlist_scrollbar.destroy();
    playlist_scrollbar = new PerfectScrollbar('#list_content');
    playlist_scrollbar.update();
}

function onAllListMouseHover(id) {
    let showMoreTimer;
    let holdMoreTimer;
    $('#list_content').on('mouseover', '#' + id, function () {
        showMoreTimer = setTimeout(function () {
            axios({
                url: 'http://localhost:23456/CheckIsLocal',
                method: 'GET',
                params: {id: id}
            }).then(respond => {
                Promise.resolve(respond.data).then(res => {
                    $('#delete').off('click');
                    if (res.toString() === 'false') {
                        $('#delete').hide();
                    } else {
                        $('#delete').show();
                        deleteBtn(id);
                    }
                });
            });
            axios({
                url: 'http://localhost:23456/GetAlbumDescription',
                method: 'GET',
                params: {id: id}
            }).then(respond => {
                Promise.resolve(respond.data).then(res => {
                    $('#description_content').html(res);
                });
            });
            axios({
                url: 'http://localhost:23456/GetNetAudioInfo',
                method: 'GET',
                params: {id: id},
                type: 'json'
            }).then(respond => {
                Promise.resolve(respond.data).then(res => {
                    let json = JSON.stringify(res);
                    json = eval('(' + json + ')');
                    let idForm = '';
                    if (isLibrary) {
                        idForm = 'local_';
                    } else {
                        idForm = 'net_';
                    }
                    document.getElementById('more_title').innerHTML = json.name != undefined ? json.name : $('#' + idForm + 'title_' + id).html();
                    // $('#more_title').html(json.name != undefined ? json.name : $('#' + idForm + 'title_' + id).html());
                    $('#more_artist').html(json.artist != undefined ? json.artist : $('#' + idForm + 'artist_' + id).html());
                    $('#more_album').html(json.album != undefined ? json.album : languageList[6]);
                });
            });
            axios({
                url: 'http://localhost:23456/GetNetAudioPicture',
                method: 'POST',
                data: {id: id},
            }).then(respond => {
                Promise.resolve(respond.data).then(res => {
                    $('#more_picture').css('background-image', 'url(' + res + ')');
                });
            });
            $('#more_info').css({'z-index': '2', 'opacity': '1'});
            clearTimeout(showMoreTimer);
        }, 1000);
        return false;
    });
    $('#list_content').on('mouseout', '#' + id, function () {
        clearTimeout(showMoreTimer);
        holdMoreTimer = setTimeout(function () {
            $('#more_info').css({'z-index': '-1', 'opacity': '0'});
            $('#description_content').html('');
            $('#more_title').html('');
            $('#more_artist').html('');
            $('#more_album').html('');
            $('#more_picture').css('background-image', '');
            clearTimeout(holdMoreTimer);
        }, 500);
        $('body').on('mouseover', '#more_info', function () {
            clearTimeout(holdMoreTimer);
            $('#more_info').removeAttr('style');
            return false;
        });
        return false;
    });
}

$.extend({
    'onListClick': function (index) {
        if (index !== undefined) {
            axios({
                url: 'http://localhost:23456/GetAudioID',
                method: 'GET',
                params: {mp3: list[index]}
            }).then(respond => {
                Promise.resolve(respond.data).then(res => {
                    if (currentID.toString() !== res.toString()) {
                        fn();
                    }
                });
            });
        } else {
            fn();
        }

        function fn() {
            $('.list_playing').each(function () {
                $(this).children('div').removeAttr('style');
            });
            if (currentListIndex !== -1) {
                axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
                $('#list_playing_icon_' + currentListIndex).hide();
            }
            isPlaying = false;
            currentListIndex = index;
            if (isPlay) {
                $("#main_btn").click();
                isPlaying = true;
            }
            $('#volume_icon').off('click');
            $(document).off('mouseup');
            $(document).off('mousemove');
            $('#process_btn' + audioIndex).off('mousedown');
            $('#volume_btn').off('mousedown');
            $("#main_btn").off('click');
            $(document).off('keydown');
            $('#process_btn' + audioIndex).css('margin-left', '-5px');
            $('#current' + audioIndex).css('width', '0px');
            $('#loop').off('click');
            loopBtn();
            setAudio(currentListIndex, true);
            if (isPlay) {
                $('#list_playing_icon_' + currentListIndex).css('animation', 'rotate 5s linear infinite');
            } else {
                $('#list_playing_icon_' + currentListIndex).css('animation', 'none');
            }
            $('#list_playing_icon_' + currentListIndex).show();
            isNet = false;
        }
    }
});

$.extend({
    'onNetListClick': function (id) {
        if (currentID.toString() !== id.toString()) {
            $('.list_playing').each(function () {
                $(this).children('div').removeAttr('style');
            });
            isPlaying = false;
            if (isPlay) {
                $('#main_btn').click();
                isPlaying = true;
            }
            if (currentID !== -1) {
                $('#list_playing_icon_net_' + currentID).hide();
            }
            currentID = id;
            axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
            $('#volume_icon').off('click');
            $(document).off('mouseup');
            $(document).off('mousemove');
            $('#process_btn' + audioIndex).off('mousedown');
            $('#volume_btn').off('mousedown');
            $("#main_btn").off('click');
            $(document).off('keydown');
            $('#process_btn' + audioIndex).css('margin-left', '-5px');
            $('#current' + audioIndex).css('width', '0px');
            $('#loop').off('click');
            setAudio(id, false);
            if (isPlay) {
                $('#list_playing_icon_net_' + currentID).css('animation', 'rotate 5s linear infinite');
            } else {
                $('#list_playing_icon_net_' + currentID).css('animation', 'none');
            }
            $('#list_playing_icon_net_' + currentID).show();
            isNet = true;
        }
    }
});

function searchBar() {
    let content;
    $('#search_content input').on('input', function () {
        let timeOut;
        timeOut = setTimeout(function () {
            content = $('#search_content input').val().toLocaleLowerCase();
            search(content);
            $('#search_content input').on('input', function () {
                clearTimeout(timeOut);
            });
        }, 1000);
    });
}

function isBottom() {
    var nScrollHeight = 0;
    var nScrollTop = 0;
    var lines = $('#list_content');
    var nDivHeight = lines.height();
    nScrollHeight = lines[0].scrollHeight;
    nScrollTop = lines[0].scrollTop;
    var paddingBottom = parseInt(lines.css('padding-bottom')), paddingTop = parseInt(lines.css('padding-top'));
    return Math.abs(nScrollHeight - (nScrollTop + paddingBottom + paddingTop + nDivHeight)) <= 1
}

function search(content) {
    $('#list_content').off('scroll');
    loadedNetAudio = [];
    searchIsChange = true;
    currentListPage = 0;
    $('#list_content').html('');
    if (content.length > 0) {
        if (isLibrary) {
            getLocalAudioList(content);
        } else {
            $('#list_content').on('scroll', function () {
                if (isBottom()) {
                    if (currentListPage <= maxPage) {
                        currentListPage++;
                        getNetAudioList(content);
                    }
                }
            });
            getNetAudioList(content);
        }
    } else {
        if (isLibrary) {
            setPlayList();
        }
    }
}

function getLocalAudioList(content) {
    if (isLibrary) {
        $('.list_playing').each(function () {
            $(this).css({'display': 'block', 'animation': 'none'});
        });
        for (let i = 0; i < list.length; i++) {
            let html = '';
            const tags = audioList[i];
            let title = tags.get('title') === 'null' ? list[i].substring(0, list[i].lastIndexOf('.')) : tags.get('title');
            let artist = tags.get('artist') === 'null' ? languageList[5] : tags.get('artist');
            let isContains = false;
            if (title.toLocaleLowerCase().indexOf(content) !== -1 || PinyinMatch.match(title.toLocaleLowerCase(), content) != false) {
                isContains = true;
            }
            if (artist.toLocaleLowerCase().indexOf(content) !== -1 || PinyinMatch.match(artist.toLocaleLowerCase(), content) != false) {
                isContains = true;
            }
            if (isContains) {
                $.ajax({
                    url: 'http://localhost:23456/GetAudioID',
                    method: 'GET',
                    data: {mp3: list[i]},
                    async: false,
                    success: function (res) {
                        html += '<div class="list" style="position: relative;" onclick="$.onListClick(' + i + ')">\n' +
                            '<div class="list_playing">\n';
                        let style = '';
                        if (currentID.toString() === res.toString()) {
                            if (isPlay) {
                                style += 'display: block; animation: rotate 5s linear infinite;';
                            } else {
                                style += 'display: block; animation: none;';
                            }
                            html += '<div id="list_playing_icon_' + i + '" style="' + style + '">';
                        } else {
                            html += '<div id="list_playing_icon_' + i + '">';
                        }
                        html += SvgImage.playIconSvg();
                        html += '</div>';
                        html += '</div>\n' +
                            '<div class="list_info">\n' +
                            '<div class="list_title" id="local_title_' + i + '" title="' + title + '">' + title + '</div>\n' +
                            '<div class="list_artist" id="local_artist_' + i + '" title="' + artist + '">' + artist + '</div>\n' +
                            '</div>\n' +
                            '<div class="list_time" id="local_time_' + i + '">' + setTime(tags.get('duration')) + '</div>\n' +
                            '<div style="width: 100%; height: 100%; position: absolute;" id="' + res.toString() + '"></div>' +
                            '</div>';
                        $('#list_content').html($('#list_content').html() + html);
                        onAllListMouseHover(res.toString());
                    }
                });
            }
        }
        if ($('#list_content').html().length === 0) {
            $('#list_content').html('<div class="no_result">无搜索结果</div>');
        }
        if (playlist_scrollbar) playlist_scrollbar.destroy();
        playlist_scrollbar = new PerfectScrollbar('#list_content');
        playlist_scrollbar.update();
    }
}

function getNetAudioList(content) {
    if (!isLibrary) {
        $('.list_playing').each(function () {
            $(this).css({'display': 'block', 'animation': 'none'});
        });
        axios({
            url: 'http://localhost:23456/GetNetAudioList',
            method: 'POST',
            data: {
                keywords: content,
                offset: currentListPage
            },
            respondType: 'json'
        }).then(response => {
            Promise.resolve(response.data).then((res) => {
                let json = JSON.stringify(res);
                json = eval('(' + json + ')');
                let songs = JSON.stringify(json.songs);
                songs = eval('(' + songs + ')');
                for (var p in songs) {
                    let song = songs[p];
                    if (loadedNetAudio.indexOf(song.id) === -1) {
                        loadedNetAudio[loadedNetAudio.length] = song.id;
                        let html = '';
                        html += '<div class="list" style="position: relative;" onclick="$.onNetListClick(' + song.id + ')">\n' +
                            '<div class="list_playing">\n';
                        if (currentID.toString() === song.id.toString()) {
                            let style = '';
                            if (isPlay) {
                                style += 'display: block; animation: rotate 5s linear infinite;';
                            } else {
                                style += 'display: block; animation: none;';
                            }
                            html += '<div id="list_playing_icon_net_' + song.id + '" style="' + style + '">';
                        } else {
                            html += '<div id="list_playing_icon_net_' + song.id + '">';
                        }
                        html += SvgImage.playIconSvg() +
                            '</div>' +
                            '</div>\n' +
                            '<div class="list_info">\n' +
                            '<div class="list_title" id="net_title_' + song.id + '" title="' + song.name + '">' + song.name + '</div>\n' +
                            '<div class="list_artist" id="net_artist_' + song.id + '" title="' + song.artists + '">' + song.artists + '</div>\n' +
                            '</div>\n' +
                            '<div class="list_time" id="net_time_' + song.id + '">' + setTime(song.duration) + '</div>\n' +
                            '<div style="width: 100%; height: 100%; position: absolute;" id="' + song.id + '"></div>' +
                            '</div>';
                        $('#list_content').append(html);
                        onAllListMouseHover(song.id);
                    }
                }
                maxPage = Math.ceil(parseInt(json.songCount) / 25.0);
                if (playlist_scrollbar) playlist_scrollbar.destroy();
                playlist_scrollbar = new PerfectScrollbar('#list_content');
                playlist_scrollbar.update();
            });
        });
    }
}


//---------------------------- 滚动歌词 ----------------------------//

// 格式化时间转秒
function timeToSecond(time) {
    let s;
    if (time.split(':').length <= 2) {
        time = '00:' + time;
    }
    const hour = time.split(':')[0];
    const min = time.split(':')[1];
    const sec = time.split(':')[2];
    s = Number(hour * 3600) + Number(min * 60) + Number(sec);
    return s;
}

// 滚动歌词初始化
function lyricsInit(number, audio, isLocal) {
    currentLyricsLine = 0;
    fillLyrics(number, audio, isLocal);
}

// 填充歌词
function fillLyrics(number, audio, isLocal) {
    document.getElementById('inner_lyrics').scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    let url = '';
    let data;
    if (isLocal) {
        url = 'http://localhost:23456/GetAudioLyric';
        data = {mp3: list[number]};
    } else {
        url = 'http://localhost:23456/GetNetAudioLyric';
        data = {id: number};
    }
    axios({
        url: url,
        method: 'POST',
        data: data
    }).then(respond => {
        Promise.resolve(respond.data).then(res => {
            lyricsTiming = [];
            lineHeight = [];
            let lyrics = res;
            let inner_lyrics = $('#inner_lyrics');
            inner_lyrics.html('');
            if (lyrics.trim() !== '') {
                let lyricsArr = lyrics.split('\n');
                for (let i = 0; i < lyricsArr.length; i++) {
                    if (lyricsArr[i].trim('\s') !== '') {
                        lyricsTiming[i] = timeToSecond(lyricsArr[i].substring(lyricsArr[i].indexOf('[') + 1, lyricsArr[i].indexOf(']')).trim());
                        let line = '';
                        if (i === 0)
                            line = '<div style="color: #d3d3d3; font-size: 18px; background-color: rgba(26,26,26,0.87);" class="line" id="line-' + i + '">' + lyricsArr[i].substring(lyricsArr[i].indexOf(']') + 1).trim() + '</div>';
                        else
                            line = '<div class="line" id="line-' + i + '">' + lyricsArr[i].substring(lyricsArr[i].indexOf(']') + 1).trim() + '</div>';
                        inner_lyrics.html(inner_lyrics.html() + line);
                        lineHeight[i] = parseInt($('#line-' + i).css('height'));
                    }
                }
                currentLyricsLine = findCloseNum(lyricsTiming, audio.currentTime);
                setLyricsScroll(audio);
            } else {
                inner_lyrics.html('<div class="no_lyrics">' + languageList[7] + '</div>');
            }
        });
    });
}

// 设置歌词滚动
function setLyricsScroll(audio) {
    audio.ontimeupdate = function () {
        let line = $('#line-' + currentLyricsLine);
        let currentTime = audio.currentTime;
        let displayTime = lyricsTiming[currentLyricsLine];
        if ((displayTime - currentTime) <= 0.0001) {
            const inner_lyrics = document.getElementById('inner_lyrics');
            line.siblings().removeAttr('style');
            line.css({'color': '#d3d3d3', 'font-size': '18px', 'background-color': 'rgba(26,26,26,0.87)'});
            if (currentLyricsLine >= 4) {
                let total = 0;
                for (let i = 0; i <= currentLyricsLine - 4; i++) {
                    total += lineHeight[i] + 5;
                }
                inner_lyrics.scrollTo({
                    top: total,
                    behavior: 'smooth'
                });
            }
            currentLyricsLine++;
        }
    }
}

//---------------------------- 顶部选项卡 ----------------------------//

function topOptionBtn() {
    $('#options_btn').hover(function () {
        $('#options_btn_path').attr('fill', "#1c1c1c");
    }, function () {
        $('#options_btn_path').attr('fill', "#515151");
    });
}

//---------------------------- 库来源 ----------------------------//

function sourceInit() {
    $('#library').click(function () {
        if (!isLibrary) {
            isLibrary = true;
            currentListPage = 0;
            $('#library').addClass('active');
            $('#library').siblings().removeClass('active');
            $('#search_content input').attr('placeholder', languageList[2] + '...');
            $('#list_content').html('');
            let content = $('#search_content input').val().toLocaleLowerCase();
            if (content.length !== 0) {
                search(content);
            } else {
                playListInit();
            }
        }
    });
    $('#net').click(function () {
        if (isLibrary) {
            isLibrary = false;
            currentListPage = 0;
            $('#net').addClass('active');
            $('#net').siblings().removeClass('active');
            $('#search_content input').attr('placeholder', languageList[3] + '...');
            $('#list_content').html('');
            let content = $('#search_content input').val().toLocaleLowerCase();
            if (content.length !== 0) {
                search(content);
            } else {
                $('#list_content').html('');
            }
        }
    });
    $('#library').addClass('active');
    $('#library').siblings().removeClass('active');
    $('#search_content input').attr('placeholder', languageList[2] + '...');
}

//---------------------------- 顶部按钮 ----------------------------//

function topBarButtonsInit() {
    close();
    min();
    setting();
}

function close() {
    $('#close').on('mouseover', function () {
        $('#close path').attr('fill', '#ec2e00');
    });
    $('#close').on('mouseout', function () {
        $('#close path').attr('fill', '#515151');
    });
    $('#close').html(SvgImage.closeSvg());
}

function min() {
    $('#min').on('mouseover', function () {
        $('#min path').attr('fill', '#ec9900');
    });
    $('#min').on('mouseout', function () {
        $('#min path').attr('fill', '#515151');
    });
    $('#min').html(SvgImage.minSvg());
}

function setting() {
    $('#setting').on('mouseover', function () {
        $('#setting path').attr('fill', '#20b2aaff');
    });
    $('#setting').on('mouseout', function () {
        $('#setting path').attr('fill', '#515151');
    });
    $('#setting').html(SvgImage.settingSvg());
    $('#setting').on('click', function () {
        $('#spectrum_box').hide();
        $('#main-page').css('margin-left', '-100%');
        setTimeout(function () {
            $('#main-page').hide();
            $('#setting-page').show();
        }, 200);
    });
}

//---------------------------- 设置侧边栏 ----------------------------//

function settingSidePanelInit() {
    backBtn();
    languageOptionBtn();
    themeOptionBtn();
    aboutOptionBtn();
    $('#language').click();
}

// 返回键
function backBtn() {
    $('#setting_back_icon').on('click', function () {
        $('#setting-page').hide();
        $('#main-page').show();
        $('#main-page').css('margin-left', '0');
        setTimeout(function () {
            $('#spectrum_box').fadeIn(200);
        }, 200);
    });
}

function optionCommon(obj) {
    $('#' + obj).addClass('active');
    $('#' + obj).siblings().removeClass('active');
}

// 设置语言
function languageOptionBtn() {
    $('#language').on('click', function () {
        optionCommon('language');
        $('#setting_panel').html('<div id="language_block">\n' +
            '<div class="setting_panel_title" id="switch_language"></div>\n' +
            '<div class="setting_block">\n' +
            '<div id="CN">简体中文</div>\n' +
            '<div id="EN">English</div>\n' +
            '</div>\n' +
            '</div>');
        $('#switch_language').html(languageList[21]);
        if (settingpanel_scrollbar) settingpanel_scrollbar.destroy();
        settingpanel_scrollbar = new PerfectScrollbar('#setting_panel');
        $('#CN').on('click', function () {
            if (language !== 'CN') {
                language = 'CN';
                languageList = languageLib.getCN();
                axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
                setLanguage();
            }
        });
        $('#EN').on('click', function () {
            if (language !== 'EN') {
                language = 'EN';
                languageList = languageLib.getEN();
                axios.post('http://localhost:23456/SetConfig?vol=' + volumeNumber * 100 + '&process=' + audio[0].currentTime + '&currentID=' + currentID + '&loopMode=' + loopMode + '&language=' + language);
                setLanguage();
            }
        });
    });
}

// 设置主题
function themeOptionBtn() {
    $('#skin').on('click', function () {
        optionCommon('skin');
        $('#setting_panel').html('');
        if (settingpanel_scrollbar) settingpanel_scrollbar.destroy();
        settingpanel_scrollbar = new PerfectScrollbar('#setting_panel');
    });
}

// 关于我们
function aboutOptionBtn() {
    $('#about').on('click', function () {
        optionCommon('about');
        $('#setting_panel').html('<div id="about_block">\n' +
            '<div class="setting_panel_title" id="about_oasis"></div>\n' +
            '<div class="setting_block">\n' +
            '<div id="markdown_content_box">' +
            '<div id="markdown_content">' +
            marked.parse('<h1> Oasis v0.0.3</h1><br>\n' +
                '<h3> ✨ Features ✨ </h3><br>\n' +
                '<ol>\n' +
                '  <li>💡 <strong>You can search and play music for free</strong><br><br></li>\n' +
                '  <li>💡 <strong>You can download the music to your local storage</strong><br><br></li>\n' +
                '  <li>💡 <strong>More features are still under development</strong><br><br></li>\n' +
                '</ol>\n' +
                '<h3> ❤️ Special Thanks ❤️ </h3><br>\n' +
                '<ol>\n' +
                '  <li>💎 <strong>https://autumnfish.cn/<strong><br><br></li>\n' +
                '  <li>💎 <strong>https://api.klizi.cn/<strong><br><br></li>\n' +
                '  <li>💎 <strong>http://ovooa.com/<strong><br><br></li>\n' +
                '</ol>') +
            '</div>' +
            '</div>' +
            '</div>\n' +
            '</div>');
        $('#about_oasis').html(languageList[23]);
        if (settingpanel_scrollbar) settingpanel_scrollbar.destroy();
        settingpanel_scrollbar = new PerfectScrollbar('#setting_panel');
    });
}