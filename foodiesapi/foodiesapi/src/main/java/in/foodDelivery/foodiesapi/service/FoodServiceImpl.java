package in.foodDelivery.foodiesapi.service;


import in.foodDelivery.foodiesapi.entity.FoodEntity;
import in.foodDelivery.foodiesapi.io.FoodRequest;
import in.foodDelivery.foodiesapi.io.FoodResponse;
import in.foodDelivery.foodiesapi.repository.FoodRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FoodServiceImpl implements FoodService{

    @Autowired
    private S3Client s3Client; //this s3Client instance is being injected using Spring's @Autowired annotation.
    @Autowired
    private FoodRepository foodRepository;

    @Value("${aws.s3.bucketname}")//Injects the S3 bucket name from the application's configuration.
    private String bucketName;

    @Override
    public String uploadFile(MultipartFile file) {
        /*getOriginalFilename() is a method of the MultipartFile
        interface. It returns the original name of the file as it was
        on the client's machine.
         */
        String filenameExtension=file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")+1);
        String key= UUID.randomUUID() +"."+filenameExtension; //1234567890ab.png
        try{
            PutObjectRequest putObjectRequest=PutObjectRequest.builder()
                    .bucket(bucketName).key(key).acl("public-read").contentType(file.getContentType())
                    .build(); //Prepare the upload request (PutObjectRequest): Specifying the target bucket, the desired key (filename in S3), the access permissions, and the content type of the file.
            //Execute the upload (s3Client.putObject): Sending the prepared request along with the actual file content to the Amazon S3 service.
            // putObjectRequest object tells the s3Client where to upload the data, what to name it, who can access it, and what type of content it is.
            PutObjectResponse response=s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes())); // This response object allows your application to determine if the file upload was successful and to retrieve any relevant metadata about the uploaded object.
            if (response.sdkHttpResponse().isSuccessful()){
                return "https://"+bucketName+".s3.amazonaws.com/"+key;
            }else{
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"file upload failed");
            }
        }catch (IOException ex){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"An error occur while uploading file");
        }
    }

    @Override
    public FoodResponse addFood(FoodRequest request, MultipartFile file) {
        FoodEntity newFoodEntity=convertToEntity(request);
        String imageurl=uploadFile(file);
        newFoodEntity.setImageUrl(imageurl);
        newFoodEntity= foodRepository.save(newFoodEntity);
        return convertToResponse(newFoodEntity);
    }

    @Override
    public List<FoodResponse> readFoods() {
        List<FoodEntity> databaseEntries=foodRepository.findAll();
        return databaseEntries.stream().map(object->convertToResponse(object)).collect(Collectors.toList());
    }

    @Override
    public FoodResponse readFood(String id) {
        FoodEntity existingFood=foodRepository.findById(id).orElseThrow(()->new RuntimeException("Food not found for the id:"+id));
        return convertToResponse(existingFood);
    }

    @Override
    public boolean deleteFile(String filename) {
        DeleteObjectRequest deleteObjectRequest=DeleteObjectRequest.builder()
                .bucket(bucketName).key(filename).build();
        s3Client.deleteObject(deleteObjectRequest);
        return true;
    }

    @Override
    public void deleteFood(String id) {
        FoodResponse response=readFood(id);
        String imageUrl=response.getImageUrl();
        String filename=imageUrl.substring(imageUrl.lastIndexOf("/")+1);
        boolean isFileDeleted=deleteFile(filename);
        if(isFileDeleted){
            foodRepository.deleteById(response.getId());
        }
    }

    //a private helper method to convert a foodrequest into a foodentity
    private FoodEntity convertToEntity(FoodRequest request){
        return FoodEntity.builder().name(request.getName()).description(request.getDescription()).category(request.getCategory())
                .price(request.getPrice()).build();
    }
    //a private helper method to convert a foodentity into a foodresponse
    private FoodResponse convertToResponse(FoodEntity entity){
        return FoodResponse.builder().id(entity.getId()).name(entity.getName()).description(entity.getDescription()).category(entity.getCategory())
                .price(entity.getPrice()).imageUrl(entity.getImageUrl()).build();
    }

}
