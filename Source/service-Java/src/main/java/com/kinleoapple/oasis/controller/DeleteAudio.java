package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.parser.Feature;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Controller
public class DeleteAudio {

    @RequestMapping(value = "/DeleteAudio", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String id = request.getParameter("id");
            System.out.println(id);

            String musicPath = System.getProperty("user.dir") + File.separator + "profile" + File.separator + "music";
            File music = new File(musicPath);
            JSONObject object = JSON.parseObject(new String(Files.readAllBytes(Paths.get(musicPath)), StandardCharsets.UTF_8), Feature.OrderedField);

            String mp3 = "";
            for (Map.Entry<String, Object> entry : object.entrySet()) {
                if (entry.getValue().toString().equals(id)) {
                    mp3 = entry.getKey();
                    break;
                }
            }
            System.out.println(mp3);

            if (mp3 != null && !mp3.equals("")) {
                String mp3Path = System.getProperty("user.dir") + File.separator + "library" + File.separator + mp3;
                String lrcPath = mp3Path.substring(0, mp3Path.lastIndexOf('.')) + ".lrc";
                File mp3File = new File(mp3Path);
                File lrcFile = new File(lrcPath);
                if (mp3File.exists()) {
                    System.out.println("mp3: " + mp3File.delete());
                }
                if (lrcFile.exists()) {
                    System.out.println("lrc: " + lrcFile.delete());
                }
                object.remove(mp3);
                System.out.println(object);
                try (FileOutputStream outputStream = new FileOutputStream(music)) {
                    outputStream.write(object.toJSONString().getBytes(StandardCharsets.UTF_8));
                }
                response.getWriter().write("finished");
            } else {
                response.getWriter().write("failed");
            }
        }
    }
}
