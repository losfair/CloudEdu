import EventStreamAPI

context = EventStreamAPI.Context()
event_id = context.add_event("test-user", "Hello world", "This is a test event")

print(event_id)
