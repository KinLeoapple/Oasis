package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.parser.Feature;
import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.flac.metadatablock.MetadataBlockDataPicture;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.images.ArtworkFactory;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;

@Controller
public class DownloadAudio {

    @RequestMapping(value = "/DownloadAudio", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException {
        File file = null;
        File lrcFile = null;
        File mp3File = null;
        JSONObject object = null;
        String name = null;
        StringBuilder artist = null;
        String musicPath = System.getProperty("user.dir") + File.separator + "profile" + File.separator + "music";
        File music = new File(musicPath);
        try {
            if (request.getRemoteAddr().equals(request.getLocalAddr())) {
                response.setContentType("text/plain");
                request.setCharacterEncoding("UTF-8");
                response.setCharacterEncoding("UTF-8");

                String id = request.getParameter("id");

                Document document = Jsoup.connect("https://autumnfish.cn/song/detail?ids=" + id)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                        .header("Accept-Encoding", "gzip, deflate")
                        .header("Connection", "keep-alive")
                        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                        .header("Host", "music.163.com")
                        .header("Cookie", "_iuqxldmzr_=32; _ntes_nnid=8fe0a77c7531ac072694dcbd94d9410c,1647067896198; _ntes_nuid=8fe0a77c7531ac072694dcbd94d9410c; NMTID=00OECgzLb_F-FnMPEEptt6vI5-wWOUAAAF_fOWeYg; WNMCID=fjhsyq.1647067896790.01.0; WEVNSM=1.0.0; WM_NI=9cD1cYctn37PqVgnoQ2ubUZKZgLYIt4TNJl6b0zk3Qj%2BzGWC0ezFIi2xieaFjVtMqwH0PnlIr7rfILRtvpH4ao2m55Z3AodMTjAUlLccrmiI17I5vConRPrBNp6R1MCDTFE%3D; WM_NIKE=9ca17ae2e6ffcda170e2e6eea6c480f3a7e1d4c82183ef8aa2c85a829b8faeae3df2aea596c26fa8b7e5d2c52af0fea7c3b92afbbd8cd2e253a1aca2d4b65cb38aa98fee5bf2abaeb6d9419ab984bacc80f88c82abef3ea2f0b68cb25baaf5b6a8d649f4bbb6a7cc63f2a8a786e44eaa8abcaef47d8cf0a08fef43b2e9be87cc4892acba91cb40a3b1fe8eb83f9aed8f90e74798b68fb6ef48a1bdbe8eec43f3e987d6f549adb29eb1f14a8eb0fab3b447819c9ca7c837e2a3; WM_TID=H7m86DIXW5hFUBFVVVd%2Fqjrh7HKJ2vwB; JSESSIONID-WYYY=sp95wt91rlkjdzEd2CbahBVP8rOxhwKdMBFfWmuGSt2ickzdi%2FT2%2BEddh8jeIJhRSl5N8WS1HNqd%2F9VaokTdUFdHkZlVkIBjjcm1HdS71SaXwRuB7%5CRgdRmTwOUEixjyyv4WUcZvuhfXPpIayd0fr%5C%5CtWK4XpfUts6zwt8Ub%2B3YpTYjm%3A1647095241414")
                        .header("Upgrade-Insecure-Requests", "1")
                        .ignoreContentType(true)
                        .timeout(20 * 1000)
                        .get();

                String jsonStr = document.body().text();
                JSONObject jsonObject = JSON.parseObject(jsonStr);
                JSONArray jsonArray = JSON.parseArray(jsonObject.get("songs").toString());
                jsonObject = JSON.parseObject(jsonArray.get(0).toString());
                name = jsonObject.get("name").toString();
                jsonArray = JSON.parseArray(jsonObject.get("ar").toString());
                ArrayList<String> artistList = new ArrayList<>();
                artist = new StringBuilder();
                for (Object value : jsonArray) {
                    JSONObject o = JSON.parseObject(value.toString());
                    artistList.add(o.get("name").toString());
                }
                for (int i = 0; i < artistList.size(); i++) {
                    artist.append(artistList.get(i));
                    if (i != artistList.size() - 1) {
                        artist.append(",");
                    }
                }
                name = name.replaceAll("/", "／").replaceAll("\"", "＂");
                artist = new StringBuilder(artist.toString().replaceAll("/", "／").replaceAll("\"", "＂"));
                String fileName = System.getProperty("user.dir") + File.separator + "library" + File.separator + artist + " - " + name + ".mp3";
//                String tempFile = System.getProperty("user.dir") + File.separator + "library" + File.separator + "TEMP-" + new Date().getTime() + ".mp4";
                file = new File(fileName);
                if (!file.getParentFile().exists()) {
                    file.getParentFile().mkdirs();
                }
                if (file.exists()) {
                    file.delete();
                    file.createNewFile();
                } else {
                    file.createNewFile();
                }
                jsonObject = JSON.parseObject(jsonObject.get("al").toString());
                String picUrl = jsonObject.get("picUrl").toString();
                String album = jsonObject.get("name").toString();
                URL Url = new URL(picUrl);
                InputStream picInputStream = Url.openStream();
                BufferedInputStream in = new BufferedInputStream(picInputStream);
                ByteArrayOutputStream picOut = new ByteArrayOutputStream();
                byte[] bytes = new byte[1024];
                int len = 0;
                while ((len = in.read(bytes)) != -1) {
                    picOut.write(bytes, 0, len);
                }
                picOut.close();
                in.close();

                document = Jsoup.connect("https://autumnfish.cn/song/url?id=" + id)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                        .header("Accept-Encoding", "gzip, deflate")
                        .header("Connection", "keep-alive")
                        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                        .header("Host", "music.163.com")
                        .header("Cookie", "_iuqxldmzr_=32; _ntes_nnid=8fe0a77c7531ac072694dcbd94d9410c,1647067896198; _ntes_nuid=8fe0a77c7531ac072694dcbd94d9410c; NMTID=00OECgzLb_F-FnMPEEptt6vI5-wWOUAAAF_fOWeYg; WNMCID=fjhsyq.1647067896790.01.0; WEVNSM=1.0.0; WM_NI=9cD1cYctn37PqVgnoQ2ubUZKZgLYIt4TNJl6b0zk3Qj%2BzGWC0ezFIi2xieaFjVtMqwH0PnlIr7rfILRtvpH4ao2m55Z3AodMTjAUlLccrmiI17I5vConRPrBNp6R1MCDTFE%3D; WM_NIKE=9ca17ae2e6ffcda170e2e6eea6c480f3a7e1d4c82183ef8aa2c85a829b8faeae3df2aea596c26fa8b7e5d2c52af0fea7c3b92afbbd8cd2e253a1aca2d4b65cb38aa98fee5bf2abaeb6d9419ab984bacc80f88c82abef3ea2f0b68cb25baaf5b6a8d649f4bbb6a7cc63f2a8a786e44eaa8abcaef47d8cf0a08fef43b2e9be87cc4892acba91cb40a3b1fe8eb83f9aed8f90e74798b68fb6ef48a1bdbe8eec43f3e987d6f549adb29eb1f14a8eb0fab3b447819c9ca7c837e2a3; WM_TID=H7m86DIXW5hFUBFVVVd%2Fqjrh7HKJ2vwB; JSESSIONID-WYYY=sp95wt91rlkjdzEd2CbahBVP8rOxhwKdMBFfWmuGSt2ickzdi%2FT2%2BEddh8jeIJhRSl5N8WS1HNqd%2F9VaokTdUFdHkZlVkIBjjcm1HdS71SaXwRuB7%5CRgdRmTwOUEixjyyv4WUcZvuhfXPpIayd0fr%5C%5CtWK4XpfUts6zwt8Ub%2B3YpTYjm%3A1647095241414")
                        .header("Upgrade-Insecure-Requests", "1")
                        .ignoreContentType(true)
                        .timeout(20 * 1000)
                        .get();

                jsonStr = document.body().text();
                jsonObject = JSON.parseObject(jsonStr);
                jsonArray = JSON.parseArray(jsonObject.get("data").toString());
                jsonObject = JSON.parseObject(jsonArray.get(0).toString());
                String url = jsonObject.get("url").toString();
                String fee = jsonObject.get("fee").toString();
//                if (url == null || fee.equals("1")) {
//                    JSONObject backupJson = ToolUtils.doBackUpApi(id);
//                    url = backupJson.get("music").toString();
//                }
                Url = new URL(url);
                InputStream audioInputStream = Url.openStream();
                BufferedInputStream audioIn = new BufferedInputStream(audioInputStream);
                FileOutputStream out = new FileOutputStream(fileName);
                byte[] audioBytes = new byte[1024];
                while ((len = audioIn.read(audioBytes)) != -1) {
                    out.write(audioBytes, 0, len);
                }
                out.close();
                audioIn.close();

                String lrc = fileName.substring(0, fileName.lastIndexOf('.')) + ".lrc";
                lrcFile = new File(lrc);
                if (!lrcFile.getParentFile().exists()) {
                    lrcFile.getParentFile().mkdirs();
                }
                if (lrcFile.exists()) {
                    lrcFile.delete();
                    lrcFile.createNewFile();
                } else {
                    lrcFile.createNewFile();
                }

                document = Jsoup.connect("https://autumnfish.cn/lyric?id=" + id)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                        .header("Accept-Encoding", "gzip, deflate")
                        .header("Connection", "keep-alive")
                        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                        .header("Upgrade-Insecure-Requests", "1")
                        .ignoreContentType(true)
                        .timeout(20 * 1000)
                        .get();

                jsonStr = document.body().text();
                jsonObject = JSON.parseObject(jsonStr);
                jsonObject = JSON.parseObject(jsonObject.get("lrc").toString());
                String lyric = jsonObject.get("lyric").toString();
                lyric = lyric.replaceAll("\\\\n", "\n");
                String[] contents = lyric.split("\n");
                StringBuilder builder = new StringBuilder();
                BufferedWriter writer = new BufferedWriter(new FileWriter(lrcFile));
                for (String s : contents) {
                    if (!s.substring(s.indexOf(']') + 1).trim().equals("")) {
                        builder.append(s).append("\n");
                    }
                }
                writer.write(new String(builder.toString().getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));
                writer.close();

//                mp3File = new File(fileName);
//                if (!mp3File.getParentFile().exists()) {
//                    mp3File.getParentFile().mkdirs();
//                }
//                if (mp3File.exists()) {
//                    mp3File.delete();
//                    mp3File.createNewFile();
//                } else {
//                    mp3File.createNewFile();
//                }

//                //Audio Attributes
//                AudioAttributes audio = new AudioAttributes();
//                audio.setCodec("libmp3lame");
//                audio.setBitRate(320000);
//                audio.setChannels(2);
//                audio.setSamplingRate(44100);
//
//                //Encoding attributes
//                EncodingAttributes attrs = new EncodingAttributes();
//                attrs.setInputFormat("mp4");
//                attrs.setOutputFormat("mp3");
//                attrs.setAudioAttributes(audio);
//
//                //Encode
//                Encoder encoder = new Encoder();
//                encoder.encode(new MultimediaObject(file), mp3File, attrs);

                AudioFile audioFile = AudioFileIO.read(file);
                Tag tag = audioFile.getTag();
                tag.setField(FieldKey.ALBUM, album);
                tag.setField(FieldKey.TITLE, name);
                tag.setField(FieldKey.ARTIST, artistList.toArray(new String[0]));
                BufferedImage image = ImageIO.read(new ByteArrayInputStream(picOut.toByteArray()));
                if (image != null) {
                    MetadataBlockDataPicture coverArt = new MetadataBlockDataPicture(picOut.toByteArray(), 0, albumImageMimeType(picOut.toByteArray()), "", image.getWidth(), image.getHeight(), image.getColorModel().hasAlpha() ? 32 : 24, 0);
                    Artwork artwork = ArtworkFactory.createArtworkFromMetadataBlockDataPicture(coverArt);
                    tag.setField(tag.createField(artwork));
                }
                AudioFileIO.write(audioFile);

                if (!music.getParentFile().exists()) {
                    music.getParentFile().mkdirs();
                }
                if (!music.exists()) {
                    music.createNewFile();
                    object = JSON.parseObject("{}", Feature.OrderedField);
                } else {
                    object = JSON.parseObject(new String(Files.readAllBytes(Paths.get(musicPath)), StandardCharsets.UTF_8), Feature.OrderedField);
                }
                object.put(artist + " - " + name + ".mp3", id);
                try (FileOutputStream outputStream = new FileOutputStream(music)) {
                    outputStream.write(object.toJSONString().getBytes(StandardCharsets.UTF_8));
                }

                response.getWriter().write("finished");
            }
        } catch (Exception e) {
            if (lrcFile != null) {
                lrcFile.delete();
            }
            if (mp3File != null) {
                mp3File.delete();
            }
            if (object != null && artist != null && name != null) {
                object.remove(artist + " - " + name + ".mp3");
                try (FileOutputStream outputStream = new FileOutputStream(music)) {
                    outputStream.write(object.toJSONString().getBytes(StandardCharsets.UTF_8));
                }
            }
            response.getWriter().write("failed");
            e.printStackTrace();
        }
//        finally {
//            if (file != null) {
//                file.delete();
//            }
//        }
    }

    private static String albumImageMimeType(byte[] albumImage) {
        byte[] mPNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};// PNG file header
        if (albumImage.length > 8) {
            for (int i = 0; i < 8; i++) {
                if (albumImage[i] != mPNG[i]) {
                    return "image/jpg";
                }
            }
        }
        return "image/png";
    }
}
