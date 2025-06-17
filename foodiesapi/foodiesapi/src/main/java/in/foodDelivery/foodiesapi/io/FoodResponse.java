package in.foodDelivery.foodiesapi.io;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/*This declares the FoodResponse class, which represents
the data structure that will be sent back to clients
(e.g., web browsers, mobile apps) when they request information
 about a food item.
 */
/*FoodResponse is a Data Transfer Object (DTO) used to structure
the response sent by your API when food item data is requested.
 It contains the same information as FoodEntity, making it suitable
 for representing the food item to the outside world.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FoodResponse {
    private String id;
    private String name;
    private String description;
    private String imageUrl;
    private double price;
    private String category;

}
