package com.artifactcomparator.repository;

import com.artifactcomparator.model.Notification;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderBySentAtDesc(Long recipientId);

    List<Notification> findByRecipientIdAndReadOrderBySentAtDesc(Long recipientId, Boolean read);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :recipientId AND n.read = false")
    Long countUnreadByRecipientId(@Param("recipientId") Long recipientId);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :recipientId AND n.type = :type ORDER BY n.sentAt DESC")
    List<Notification> findByRecipientIdAndType(@Param("recipientId") Long recipientId,
                                                 @Param("type") Notification.NotificationType type);

    void deleteByRecipientId(Long recipientId);

    List<Notification> findByRecipientAndRelatedEntityTypeAndRelatedEntityId(
            User recipient,
            Notification.RelatedEntityType relatedEntityType,
            Long relatedEntityId
    );
}
