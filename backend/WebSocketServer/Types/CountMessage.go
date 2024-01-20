package Types

type CountMessage struct {
	Count int
}

func NewCountMessage(count int) CountMessage {
	return CountMessage{Count: count}
}
