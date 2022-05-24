import json
import subprocess
import mutagen
from flask import Flask
from flask import request
from flask import Response
import requests
import json5
import pathlib
import os
from mutagen.id3 import ID3, TIT2, TPE1, TALB, APIC
from mutagen.mp3 import MP3
import base64

app = Flask(__name__)

'''
全局变量:
    current_dir 当前目录
    sep 当前系统分隔符
    library_path library路径
    profile_path profile路径
    music_path music索引文件路径
    config_path config文件路径
'''
current_dir = os.getcwd()
sep = os.path.sep
library_path = pathlib.Path(current_dir + sep + 'library' + sep)
profile_path = pathlib.Path(current_dir + sep + 'profile' + sep)
temporary_resources_path = pathlib.Path(current_dir + sep + 'temporary' + sep)
music_path = pathlib.Path(current_dir + sep + 'profile' + sep + 'music')
config_path = pathlib.Path(current_dir + sep + 'profile' + sep + 'config')

# 程序入口
if __name__ == '__main__':
    app.run(port=23456)

'''
controller
'''


@app.route('/CheckHasRight/', methods=['GET', 'POST'])
def check_has_right():
    song_id = request.args.get('id', '')
    try:
        response_json = web_connector('https://autumnfish.cn/check/music?id=' + song_id)
        json_object = response_json
        if json_object['success']:
            return Response('true')
        else:
            return Response('false')
    except Exception as e:
        print(e)
        return 'false'


# 检查音频是否已经在本地
@app.route('/CheckIsLocal/', methods=['GET', 'POST'])
def check_is_local():
    song_id = request.args.get('id', '')
    if not music_path.exists():
        return Response('false')
    file = open(music_path, 'r', encoding='utf-8')
    json_object = json5.load(file)
    file.close()
    for key in json_object:
        if json_object[key] == song_id:
            return Response(key)
    return Response('false')


# 删除本地音频
@app.route('/DeleteAudio/', methods=['GET', 'POST'])
def delete_audio():
    song_id = request.args.get('id', '')
    music = open(music_path, 'r', encoding='utf-8')
    json_object = json5.load(music)
    music.close()
    mp3 = ''
    for key in json_object:
        if json_object[key] == song_id:
            mp3 = key
            break

    if mp3 is not None and mp3 != '':
        mp3_path = pathlib.Path(str(library_path.absolute()) + sep + mp3)
        lrc_path = pathlib.Path(str(library_path.absolute()) + sep + mp3[0: mp3.rindex('.')] + '.lrc')
        if mp3_path.exists():
            mp3_path.unlink()
        if lrc_path.exists():
            lrc_path.unlink()

        del json_object[mp3]
        music = open(music_path, 'w', encoding='utf-8')
        music.write(str(json_object))
        music.close()
        return Response('finished')
    else:
        return Response('failed')


# 下载音频
@app.route('/DownloadAudio/', methods=['GET', 'POST'])
def download_audio():
    file, lrc_file, pic_path, name, artist = '', '', '', '', ''
    try:
        song_id = request.args.get('id', '')

        # 获取曲名与艺人列表
        response_json = web_connector('https://autumnfish.cn/song/detail?ids=' + song_id)
        json_object = response_json
        json_array = json_object['songs'][0]
        name = json_array['name']
        json_array = json_array['ar']
        i = 0
        artist = ''
        for value in json_array:
            artist += str(value['name'])
            if i < len(json_array) - 1:
                artist += ','
            i += 1
        name = str(name).replace('/', '／').replace('\"', '＂')

        # 拼接音频文件名
        file = str(library_path.absolute()) + sep + artist + ' - ' + name + '.mp3'
        if pathlib.Path(file).exists():
            pathlib.Path(file).unlink()
            f = open(file, 'w+')
        else:
            f = open(file, 'w+')
        f.close()

        # 获取音频封面与专辑名
        json_object = json_object['songs'][0]['al']
        pic_url = json_object['picUrl']
        album = json_object['name']
        r = requests.get(pic_url)
        pic_path = str(temporary_resources_path.absolute()) + sep + song_id + '_cover.jpg'
        f = open(pic_path, 'wb')
        f.write(r.content)
        f.close()
        r.close()

        # 获取音频下载地址并下载
        response_json = web_connector('https://autumnfish.cn/song/url?id=' + song_id)
        json_object = response_json
        json_array = json_object['data'][0]
        url = json_array['url']
        fee = json_array['fee']
        r = requests.get(url)
        pathlib.Path(file).open(mode='wb').write(r.content)
        r.close()

        # 获取歌词并下载
        lrc_file = file[0: file.rindex('.mp3')] + '.lrc'
        if pathlib.Path(lrc_file).exists():
            pathlib.Path(lrc_file).unlink()
            f = open(lrc_file, 'w+')
        else:
            f = open(lrc_file, 'w+')
        f.close()
        response_json = web_connector('https://autumnfish.cn/lyric?id=' + song_id)
        json_object = response_json
        lyric = json_object['lrc']['lyric']
        lyric = str(lyric).replace('\\\\n', '\n')
        contents = lyric.split('\n')
        lyric_builder = ''
        for i in range(0, len(contents) - 1):
            if contents[i][contents[i].index(']') + 1:].strip() != '':
                lyric_builder += contents[i] + '\n'
        pathlib.Path(lrc_file).open(mode='w', encoding='utf-8').write(lyric_builder)

        # 写入音频ID3标签
        with open(pic_path, 'rb') as f:
            pic_data = f.read()
        id3 = ID3(file)
        id3.delete()
        id3.add(TIT2(encoding=3, text=name))
        id3.add(TPE1(encoding=3, text=artist))
        id3.add(TALB(encoding=3, text=album))
        if id3.getall('APIC'):
            id3.delall('APIC')
        id3.add(APIC(
            encoding=0,
            mime=u'image/jpeg',
            type=3,
            data=pic_data
        ))
        id3.save()

        # 向music索引中添加音频id
        music = open(music_path, 'r', encoding='utf-8')
        json_object = json5.load(music)
        music.close()
        music = open(music_path, 'w', encoding='utf-8')
        json_object.update({artist + ' - ' + name + '.mp3': song_id})
        music.write(str(json_object))
        music.close()

        return Response('finished')

    except Exception as e:
        print(e)
        if pathlib.Path(file).exists():
            pathlib.Path(file).unlink()
        if pathlib.Path(lrc_file).exists():
            pathlib.Path(lrc_file).unlink()

        music = open(music_path, 'w', encoding='utf-8')
        json_object = json5.load(music)
        del json_object[artist + ' - ' + name + '.mp3']
        music.write(json_object)
        music.close()

        return Response('failed')
    finally:
        if pathlib.Path(pic_path).exists():
            pathlib.Path(pic_path).unlink()


# 获取专辑的介绍
@app.route('/GetAlbumDescription/', methods=['GET', 'POST'])
def get_album_description():
    song_id = request.args.get('id', '')

    # 获取专辑id
    response_json = web_connector('https://autumnfish.cn/song/detail?ids=' + song_id)
    json_object = response_json
    json_object = json_object['songs'][0]['al']
    album_id = json_object['id']

    # 获取专辑介绍
    response_json = web_connector(
        'http://music.163.com/api/album/' + str(album_id) + '?ext=true&id=' + str(
            album_id) + '&offset=0&total=true&limit=1')
    json_object = response_json
    description = json_object['album']['description']
    if description is not None:
        description = description.replace('\\n', '<br>')
        return Response(description)
    else:
        return Response('')


# 获取本地音频
@app.route('/GetAudio/', methods=['GET', 'POST'])
def get_audio():
    mp3 = request.args.get('mp3', '')

    if mp3 is not None and mp3 != 'null':
        audio_file = str(library_path.absolute()) + sep + mp3
        return Response(str(pathlib.Path(audio_file).absolute()))


# 获得音频id
@app.route('/GetAudioID/', methods=['GET', 'POST'])
def get_audio_id():
    mp3 = request.args.get('mp3', '')

    with open(music_path, 'r', encoding='utf-8') as f:
        music = json5.load(f)
    audio_id = music[mp3]

    return Response(audio_id)


# 获得音频信息
@app.route('/GetAudioInfo/', methods=['GET', 'POST'])
def get_audio_info():
    mp3 = request.args.get('mp3', '')

    file = str(library_path.absolute()) + sep + mp3
    audio_file = mutagen.File(file)
    artist = audio_file.tags["TPE1"].text[0]  # 作者
    title = audio_file.tags["TIT2"].text[0]  # 标题
    audio = MP3(file)
    duration = audio.info.length  # 时长

    # 构建JSON
    json_object = '{\'duration\':\'' + str(duration) + '\',\'artist\':\'' + artist + '\',\'title\':\'' + title + '\'}'
    return Response(json_object)


# 获取音频歌词
@app.route('/GetAudioLyric/', methods=['GET', 'POST'])
def get_audio_lyric():
    request_data = request.get_data()
    lyric_builder = ''
    if request_data is not None:
        request_json = json5.loads(request_data)
        mp3 = request_json['mp3']
        lrc = str(library_path.absolute()) + sep + str(mp3)[0: str(mp3).rindex('.')] + '.lrc'
        lrc_file = open(lrc, 'r', encoding='utf-8')
        lrc_buffer = lrc_file.readlines()
        lrc_file.close()
        lyric_builder = lrc_buffer

    return Response(lyric_builder)


# 获取音频封面
@app.route('/GetAudioPicture/', methods=['GET', 'POST'])
def get_audio_picture():
    request_data = request.get_data()
    if request_data is not None:
        try:
            request_json = json5.loads(request_data)
            mp3 = request_json['mp3']
            file = str(library_path.absolute()) + sep + mp3
            audio_file = mutagen.File(file)
            cover = audio_file.tags['APIC:'].data
            cover_base64 = 'data:image/jpeg;base64,' + str(base64.b64encode(cover), 'utf-8')
            return Response(cover_base64)
        except Exception as e:
            print(e)
            return Response('null')


# 获取软件配置
@app.route('/GetConfig/', methods=['GET', 'POST'])
def get_config():
    with open(str(config_path.absolute()), 'r', encoding='utf-8') as f:
        config_json = f.read()
    return Response(config_json)


# 获取本地音频列表
@app.route('/GetLibraryList/', methods=['GET', 'POST'])
def get_library_list():
    with open(str(music_path.absolute()), 'r', encoding='utf-8') as f:
        music_json = json5.load(f)
    count = 1
    json_object = json5.loads('{}')
    for key in music_json:
        json_object[str(count)] = key
        count = int(count) + 1

    return Response(str(json_object))


# 获取网络音频
@app.route('/GetNetAudio/', methods=['GET', 'POST'])
def get_net_audio():
    song_id = request.args.get('id', '')
    response_json = web_connector('https://autumnfish.cn/song/url?id=' + song_id)
    json_object = response_json
    json_array = json_object['data'][0]
    url = json_array['url']
    fee = json_array['fee']

    # 返回url
    if url is not None and str(fee) != '1':
        return Response('{\'urls\':[{\'url\':\'' + url + '\'}]}')
    else:
        return Response('null')


# 获取网络音频信息
@app.route('/GetNetAudioInfo/', methods=['GET', 'POST'])
def get_net_audio_info():
    song_id = request.args.get('id', '')

    if str(song_id) != '-1':
        response_json = web_connector('https://autumnfish.cn/song/detail?ids=' + song_id)
        json_object = response_json
        json_array = json_object['songs'][0]
        name = json_array['name']
        json_array = json_array['ar']
        i = 0
        artist = ''
        for value in json_array:
            artist += str(value['name'])
            if i < len(json_array) - 1:
                artist += '/'
            i += 1
        json_object = json_object['songs'][0]['al']
        album = json_object['name']

        final_object = '{\'name\':\'' + name + '\',\'artist\':\'' + artist + '\',\'album\':\'' + album + '\'}'
        return Response(final_object)
    else:
        return Response('null')


# 检查服务器是否上线
@app.route('/GetNetAudioList/', methods=['GET', 'POST'])
def get_net_audio_list():
    request_data = request.get_data()
    final_object = json5.loads('{}')
    block_map = json5.loads('{}')
    if request_data is not None:
        request_json = json5.loads(request_data)
        keywords = request_json['keywords']
        offset = request_json['offset']
        response_json = web_connector(
            'https://autumnfish.cn/search?keywords=' + str(keywords) + '&limit=25&offset=' + str(offset))
        json_object = response_json['result']
        json_array = json_object['songs']

        for i in range(0, len(json_array) - 1):
            o = json_array[i]
            song_id = o['id']
            name = o['name']
            artist_array = o['artists']
            artists = ''
            for j in range(0, len(artist_array)):
                artist = artist_array[j]
                artists += artist['name']
                if j < len(artist_array) - 1:
                    artists += '/'
            duration = o['duration']
            block_json = json5.loads('{}')
            block_json['id'] = str(song_id)
            block_json['name'] = str(name)
            block_json['artists'] = str(artists)
            block_json['duration'] = str(duration / 1000.0)

            block_map[str(song_id)] = block_json

        final_object["songs"] = block_map
        final_object['songCount'] = json_object['songCount']

        return Response(str(json.dumps(final_object)))


# 获取网络音频歌词
@app.route('/GetNetAudioLyric/', methods=['GET', 'POST'])
def get_net_audio_lyric():
    request_data = request.get_data()
    if request_data is not None:
        request_json = json5.loads(request_data)
        song_id = request_json['id']
        response_json = web_connector('https://autumnfish.cn/lyric?id=' + str(song_id))
        json_object = response_json
        lyric = json_object['lrc']['lyric']
        lyric = str(lyric).replace('\\\\n', '\n')
        contents = lyric.split('\n')
        lyric_builder = ''
        for i in range(0, len(contents) - 1):
            if contents[i][contents[i].index(']') + 1:].strip() != '':
                lyric_builder += contents[i] + '\n'

        return Response(lyric_builder)


# 获取网络音频封面
@app.route('/GetNetAudioPicture/', methods=['GET', 'POST'])
def get_net_audio_picture():
    request_data = request.get_data()
    if request_data is not None:
        request_json = json5.loads(request_data)
        song_id = request_json['id']
        if str(song_id) != '-1':
            try:
                response_json = web_connector('https://autumnfish.cn/song/detail?ids=' + str(song_id))
                json_object = response_json
                json_object = json_object['songs'][0]['al']
                pic_url = json_object['picUrl']
                return Response(pic_url)
            except Exception as e:
                print(e)
                return Response('null')
    else:
        return Response('null')


# 设置config
@app.route('/SetConfig/', methods=['GET', 'POST'])
def set_config():
    volume = request.args.get('vol', '')
    process = request.args.get('process', '')
    current_id = request.args.get('currentID', '')
    loop_mode = request.args.get('loopMode', '')
    language = request.args.get('language', '')
    theme = request.args.get('theme', '')

    with open(str(config_path.absolute()), 'w', encoding='utf-8') as f:
        f.write('{\'volume\':\'' + volume + '\','
                          '\'process\':\'' + process + '\','
                          '\'currentID\':\'' + current_id + '\','
                          '\'loopMode\':\'' + loop_mode + '\','
                          '\'lang\':\'' + language + '\','
                          '\'theme\':\'' + theme + '\'}')
    return Response('true')


# 检查服务器是否上线
@app.route('/CheckIsOnline/', methods=['GET', 'POST'])
def check_is_online():
    return Response('hi,there!')


def shutdown_server():
    pid = os.getpid()
    subprocess.Popen('taskkill /pid ' + str(pid) + ' /T /F', shell=True)


@app.route('/shut_down/', methods=['POST'])
def shutdown():
    shutdown_server()
    print('Server shutting down...')
    return 'Server shutting down...'


# 在请求前检查
@app.before_request
def activate_job():
    # 判断library是否存在
    if not library_path.exists():
        os.makedirs(current_dir + sep + 'library' + sep)
    # 判断profile是否存在
    if not profile_path.exists():
        os.makedirs(current_dir + sep + 'profile' + sep)
    # 判断temporary是否存在
    if not temporary_resources_path.exists():
        os.makedirs(current_dir + sep + 'temporary' + sep)
    # 判断music文件是否存在
    if not music_path.exists():
        music_file = open(current_dir + sep + 'profile' + sep + 'music', 'w', encoding='utf-8')
        music_file.write('{}')
        music_file.close()
    # 判断config文件是否存在
    if not config_path.exists():
        config_file = open(current_dir + sep + 'profile' + sep + 'config', 'w', encoding='utf-8')
        config_file.write('{\'volume\': \'15\','
                          '\'process\':\'0\','
                          '\'currentID\':\'-1\','
                          '\'loopMode\':\'-1\','
                          '\'lang\':\'CN\','
                          '\'theme\':\'default\'}')
        config_file.close()


# 连接网络接口，返回JSON数据
def web_connector(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/99.0.4844.51 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Host": "music.163.com",
        "Cookie": "_iuqxldmzr_=32; _ntes_nnid=8fe0a77c7531ac072694dcbd94d9410c,1647067896198; "
                  "_ntes_nuid=8fe0a77c7531ac072694dcbd94d9410c; NMTID=00OECgzLb_F-FnMPEEptt6vI5-wWOUAAAF_fOWeYg; "
                  "WNMCID=fjhsyq.1647067896790.01.0; WEVNSM=1.0.0; "
                  "WM_NI=9cD1cYctn37PqVgnoQ2ubUZKZgLYIt4TNJl6b0zk3Qj"
                  "%2BzGWC0ezFIi2xieaFjVtMqwH0PnlIr7rfILRtvpH4ao2m55Z3AodMTjAUlLccrmiI17I5vConRPrBNp6R1MCDTFE%3D; "
                  "WM_NIKE"
                  "=9ca17ae2e6ffcda170e2e6eea6c480f3a7e1d4c82183ef8aa2c85a829b8faeae3df2aea596c26fa8b7e5d2c52af0fea7c3b92afbbd8cd2e253a1aca2d4b65cb38aa98fee5bf2abaeb6d9419ab984bacc80f88c82abef3ea2f0b68cb25baaf5b6a8d649f4bbb6a7cc63f2a8a786e44eaa8abcaef47d8cf0a08fef43b2e9be87cc4892acba91cb40a3b1fe8eb83f9aed8f90e74798b68fb6ef48a1bdbe8eec43f3e987d6f549adb29eb1f14a8eb0fab3b447819c9ca7c837e2a3; WM_TID=H7m86DIXW5hFUBFVVVd%2Fqjrh7HKJ2vwB; JSESSIONID-WYYY=sp95wt91rlkjdzEd2CbahBVP8rOxhwKdMBFfWmuGSt2ickzdi%2FT2%2BEddh8jeIJhRSl5N8WS1HNqd%2F9VaokTdUFdHkZlVkIBjjcm1HdS71SaXwRuB7%5CRgdRmTwOUEixjyyv4WUcZvuhfXPpIayd0fr%5C%5CtWK4XpfUts6zwt8Ub%2B3YpTYjm%3A1647095241414",
        "Upgrade-Insecure-Requests": "1"
    }
    response = requests.get(url, headers=headers, timeout=20)
    response.encoding = 'utf-8'
    return response.json()
