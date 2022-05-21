package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Controller
public class GetLibraryList {

    @RequestMapping(value = "/GetLibraryList", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws Exception {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String basePath = System.getProperty("user.dir") + File.separator + "library";
            File base = new File(basePath);
            if (!base.exists()) {
                base.mkdirs();
            }

            JSONObject jsonObject = new JSONObject();
            int count = 1;
            for (Map.Entry<String, Object> entry : library().entrySet()) {
                jsonObject.put(String.valueOf(count), entry.getKey());
                count++;
            }

            response.getWriter().write(jsonObject.toJSONString());
        }
    }

    private JSONObject library() throws IOException {
        JSONObject object;
        String musicPath = System.getProperty("user.dir") + File.separator + "profile" + File.separator + "music";
        File library = new File(musicPath);
        if (!library.getParentFile().exists()) {
            library.getParentFile().mkdirs();
        }
        if (!library.exists()) {
            library.createNewFile();
            object = JSON.parseObject("{}");
        } else {
            object = JSON.parseObject(new String(Files.readAllBytes(Paths.get(musicPath)), StandardCharsets.UTF_8));
        }
        return object;
    }
}
