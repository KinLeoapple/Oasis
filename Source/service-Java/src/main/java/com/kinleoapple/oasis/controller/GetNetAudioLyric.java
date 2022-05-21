package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Controller
public class GetNetAudioLyric {

    @RequestMapping(value = "/GetNetAudioLyric", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response, @RequestBody GetNetAudioLyricParameter parameter) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String id = parameter.getId();

            Document document = Jsoup.connect("https://autumnfish.cn/lyric?id=" + id)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                    .header("Accept-Encoding", "gzip, deflate")
                    .header("Connection", "keep-alive")
                    .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                    .header("Upgrade-Insecure-Requests", "1")
                    .ignoreContentType(true)
                    .timeout(20 * 1000)
                    .get();

            String jsonStr = document.body().text();
            JSONObject jsonObject = JSON.parseObject(jsonStr);
            jsonObject = JSON.parseObject(jsonObject.get("lrc").toString());
            String lyric = jsonObject.get("lyric").toString();
            lyric = lyric.replaceAll("\\\\n", "\n");
            String[] contents = lyric.split("\n");
            StringBuilder builder = new StringBuilder();
            for (String s : contents) {
                if (!s.substring(s.indexOf(']') + 1).trim().equals("")) {
                    builder.append(s).append("\n");
                }
            }
            response.getWriter().write(builder.toString());
        }
    }
}

class GetNetAudioLyricParameter {

    private String id;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
