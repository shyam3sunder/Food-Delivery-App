package in.foodDelivery.foodiesapi.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


//FoodEntity is the model that represents how food data is stored in your MongoDB database.
// represents a single food item in your application's data model.
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "foods")//This indicates that instances of FoodEntity will be stored in a MongoDB collection named "foods"
//maps this entity to the "foods" collection in your MongoDB database.
public class FoodEntity {
    @Id //primary key
    private String id;
    private String name;
    private String description;
    private double price;
    private String category;
    private String imageUrl;

}
