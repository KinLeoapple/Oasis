package com.kinleoapple.oasis.customization;

import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@Component
public class Construct {

    @PostConstruct
    public void doConstruct() throws Exception {
        File config = new File(System.getProperty("user.dir") + File.separator + "profile" + File.separator + "config");
        File music = new File(System.getProperty("user.dir") + File.separator + "profile" + File.separator + "music");
        File library = new File(System.getProperty("user.dir") + File.separator + "library" + File.separator);

        if (!config.getParentFile().exists()) {
            config.getParentFile().mkdirs();
        }
        if (!config.exists()) {
            config.createNewFile();
            StringBuilder builder = new StringBuilder();
            builder.append("{\"volume\": \"").append(15)
                    .append("\",\"process\":\"").append(0)
                    .append("\",\"currentID\":\"").append(-1)
                    .append("\",\"loopMode\":\"").append(0)
                    .append("\",\"lang\":\"").append("CN")
                    .append("\",\"theme\":\"").append("default").append("\"}");
            try (FileOutputStream outputStream = new FileOutputStream(config)) {
                outputStream.write(builder.toString().getBytes(StandardCharsets.UTF_8));
            }
        }
        if (!music.getParentFile().exists()) {
            music.getParentFile().mkdirs();
        }
        if (!music.exists()) {
            music.createNewFile();
            try (FileOutputStream outputStream = new FileOutputStream(music)) {
                outputStream.write("{}".getBytes(StandardCharsets.UTF_8));
            }
        }
        if (!library.exists()) {
            library.mkdirs();
        }
    }
}