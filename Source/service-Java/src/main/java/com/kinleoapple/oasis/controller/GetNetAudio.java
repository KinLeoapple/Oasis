package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Controller
public class GetNetAudio {

    @RequestMapping(value = "/GetNetAudio", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String id = request.getParameter("id");

            Document document = Jsoup.connect("https://autumnfish.cn/song/url?id=" + id)
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
            JSONArray jsonArray = JSON.parseArray(jsonObject.get("data").toString());
            jsonObject = JSON.parseObject(jsonArray.get(0).toString());
            Object url = jsonObject.get("url");
            Object fee = jsonObject.get("fee");

            if (url != null && !fee.toString().equals("1")) {
                response.getWriter().write("{\"urls\":[{\"url\":\"" + url + "\"}]}");
            } else {
//                JSONObject backupJson = ToolUtils.doBackUpApi(id);
                response.getWriter().write("null");
            }
        }
    }
}


