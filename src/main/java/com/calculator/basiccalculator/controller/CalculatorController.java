package com.calculator.basiccalculator.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CalculatorController {

    @PostMapping("/calculate")
    public ResponseEntity<CalculationResponse> calculate(@RequestBody CalculationRequest request) {
        try {
            double result = switch (request.operator()) {
                case "+" -> request.num1() + request.num2();
                case "-" -> request.num1() - request.num2();
                case "*" -> request.num1() * request.num2();
                case "/" -> {
                    if (request.num2() == 0) throw new IllegalArgumentException("Cannot divide by zero");
                    yield request.num1() / request.num2();
                }
                default -> throw new IllegalArgumentException("Invalid operator");
            };
            return ResponseEntity.ok(new CalculationResponse(result, null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new CalculationResponse(0, e.getMessage()));
        }
    }
}

// DTOs placed in the same file to save space
record CalculationRequest(double num1, double num2, String operator) {}
record CalculationResponse(double result, String error) {}