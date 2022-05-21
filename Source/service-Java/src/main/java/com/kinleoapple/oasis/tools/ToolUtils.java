package com.kinleoapple.oasis.tools;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ToolUtils {
    public static String formatStr(String str) {
        StringBuilder builder = new StringBuilder();
        char[] chs = str.toCharArray();
        for (char ch : chs) {
            if (ch == '\"' || ch == '\\') {
                builder.append("\\").append(ch);
            } else {
                builder.append(ch);
            }
        }
        return builder.toString();
    }

    public static JSONObject doBackUpApi(String id) throws IOException {
        JSONObject backupJson = new JSONObject(new LinkedHashMap<>());
        ExecutorService service = Executors.newCachedThreadPool();
        CountDownLatch latch = new CountDownLatch(10);
        List<JSONObject> syncList = Collections.synchronizedList(new ArrayList<>());

        Document titleAndArtist = Jsoup.connect("http://localhost:23456/GetNetAudioInfo?id=" + id).get();
        String titleAndArtistText = titleAndArtist.body().text();
        JSONObject titleAndArtistJson = JSON.parseObject(titleAndArtistText);
        String title = titleAndArtistJson.get("name").toString().replaceAll("(\\r\\n|\\n)", "").trim();
        String artist = titleAndArtistJson.get("artist").toString().trim();
        String[] artistArr = artist.split("/");
        String msg = title + artist;

        class runnable implements Runnable {

            private final String msg;
            private final int i;

            public runnable(String msg, int i) {
                this.msg = msg;
                this.i = i;
            }

            @Override
            public void run() {
                Document backup = null;
                try {
                    // http://ovooa.com/API/QQ_Music/?Skey=&uin=&msg=夜曲&n=1
                    // https://api.klizi.cn/API/music/vipqqyy.php?data=&msg=周杰伦&n=1&uin=&skey=
                    backup = Jsoup.connect("http://ovooa.com/API/QQ_Music/?Skey=&uin=&msg=" + msg + "&n=" + i)
                            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0")
                            .header("Accept", "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2")
                            .header("Accept-Encoding", "gzip, deflate")
                            .header("Connection", "keep-alive")
                            .header("Cache-Control", "max-age=0")
                            .header("Referer", "http://ovooa.com/?action=doc&id=117")
                            .header("Cookie", "PHPSESSID=llfhgjuutb74n5rau09uomf80p")
                            .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                            .header("Upgrade-Insecure-Requests", "1")
                            .ignoreContentType(true)
                            .timeout(20 * 1000)
                            .get();
                    String backupStr = backup.body().text();
                    JSONObject object = JSON.parseObject(backupStr);
                    object = JSON.parseObject(object.get("data").toString());
                    Object url = object.get("music");

                    System.out.println(syncList);

                    Object singer = object.get("singer");
                    Object lyric = object.get("lyric");
                    String tempTitle;
                    if (lyric != null && !lyric.toString().equals("")) {
                        tempTitle = lyric.toString().substring("[ti:".length(), lyric.toString().indexOf("]"));
                    } else {
                        String authority = "y.qq.com";
                        String webSiteUrl = object.get("url").toString();
                        String path = webSiteUrl.substring(("http://" + authority).length(), webSiteUrl.lastIndexOf(".html"));
                        Document web = Jsoup.connect(webSiteUrl)
                                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36")
                                .header("authority", authority)
                                .header("method", "GET")
                                .header("path", path)
                                .header("scheme", "https")
                                .header("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9")
                                .header("accept-encoding", "gzip, deflate")
                                .header("accept-language", "zh-CN,zh;q=0.9")
                                .header("cache-control", "max-age=0")
                                .header("cookie", "pgv_pvid=8587777108; fqm_pvqid=8eafa5fe-f1a6-4051-8ac1-5739c7193e70; fqm_sessionid=e881f0b0-bc48-48c3-9b4f-32fe2b7e7024; pgv_info=ssid=s1095051365; ts_uid=4882890906; ts_last=y.qq.com/n/ryqq/player")
                                .header("sec-ch-ua", " \" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"")
                                .header("sec-ch-ua-mobile", "?0")
                                .header("sec-ch-ua-platform", "\"Windows\"")
                                .header("sec-fetch-dest", "document")
                                .header("sec-fetch-mode", "navigate")
                                .header("sec-fetch-site", "none")
                                .header("sec-fetch-user", "?1")
                                .header("upgrade-insecure-requests", "1")
                                .timeout(20 * 1000)
                                .get();
                        tempTitle = web.getElementsByClass("data__name_txt").text();
                    }
                    tempTitle = tempTitle.replaceAll("(\\r\\n|\\n)", "").trim();
                    System.out.println(tempTitle);
                    for (String s : artistArr) {
                        System.out.println(singer.toString().contains(s) + "\t" + tempTitle.equals(title));
                        if (singer.toString().contains(s)) {
                            if (tempTitle.equals(title)) {
                                JSONObject jsonObject = new JSONObject();
                                jsonObject.put("url", url);
                                jsonObject.put("artist", singer);
                                jsonObject.put("title", title);
                                syncList.add(jsonObject);
                                break;
                            }
                        }
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                } finally {
                    latch.countDown();
                }
            }
        }

        for (int i = 1; i <= 10; i++) {
            service.submit(new runnable(msg, i));
        }
        try {
            latch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        backupJson.put("urls", syncList);
        System.out.println(backupJson);
        return backupJson;
    }
}
//:authority: y.qq.com
//:method: GET
//:path: /n/ryqq/songDetail/001zMQr71F1Qo8
//:scheme: https
//accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
//accept-encoding: gzip, deflate, br
//accept-language: zh-CN,zh;q=0.9
//cache-control: max-age=0
//cookie: pgv_pvid=8587777108; fqm_pvqid=8eafa5fe-f1a6-4051-8ac1-5739c7193e70; fqm_sessionid=e881f0b0-bc48-48c3-9b4f-32fe2b7e7024; pgv_info=ssid=s1095051365; ts_uid=4882890906; ts_last=y.qq.com/n/ryqq/player
//sec-ch-ua: " Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"
//sec-ch-ua-mobile: ?0
//sec-ch-ua-platform: "Windows"
//sec-fetch-dest: document
//sec-fetch-mode: navigate
//sec-fetch-site: none
//sec-fetch-user: ?1
//upgrade-insecure-requests: 1
//user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36
