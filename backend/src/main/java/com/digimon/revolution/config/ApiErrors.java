package com.digimon.revolution.config;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail conflict(){return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"Another checkpoint was saved. Reload before syncing again.");}
}
