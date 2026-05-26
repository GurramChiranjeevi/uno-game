# Version_1: 
- This version will be a single client game, containing two players, There will one person player for both players. 

# Features: 
## Setup (for two player game). 
  
  - Distribute cards betwen two players.
  - For the initial phase mock the players. 
  ### UI 
    - Minimilistic ui containing 2 player and drawing pile and discard pile.
      - Keep cards as simple boxes with color and numbers. 
      - When it is user turn, highlight the player name by bordering it. 
      - drawing pile should be in between 
      - put the discard card on the right middle. 

## Playing a card :
- When it's player turn, 
  - if there is a playable card, it should be highlighted. 
    - highlight the card by bringing it up. 
    - When they click on the playble card it should : 
      - Go from player hand to the discard pile. 
      - Animate the card going to the discard pile. 
    - update the cards in backend. 
  - if no playable card: 
    - they should be informed to draw a card. 

## Drawing card
  * given the user is prompted to draw a card. 
  - when user clicks on the drawing pile 
  - then they should recieve the card. 
  * Animate the drawing of card.

