package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/raffle")
public class RaffleController {
    private final RaffleService raffleService;

    public RaffleController(RaffleService raffleService) {
        this.raffleService = raffleService;
    }

    @PostMapping("/winner")
    public ResponseEntity<?> chooseWinner(@RequestBody RaffleRequest request) {
        try {
            String winner = raffleService.selectWinner(request.getNames());
            return ResponseEntity.ok(Map.of("winner", winner));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", exception.getMessage()));
        }
    }
}