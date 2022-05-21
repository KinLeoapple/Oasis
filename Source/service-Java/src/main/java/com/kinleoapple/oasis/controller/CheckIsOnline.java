package com.kinleoapple.oasis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Controller
public class CheckIsOnline {

    @RequestMapping(value = "/CheckIsOnline", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.getWriter().write("hi,there!");
        }
    }
}
