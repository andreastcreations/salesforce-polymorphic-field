export function getMapData() {
  return [
    {
      option: {
        id: "option1-users",
        label: "Users",
        icon: "standard:user"
      },
      result: {
        objectApiName: "User",
        optionLabelApiName: "Name",
        optionCommentApiName: "Email",
        conditions: ["IsActive = TRUE"]
      }
    },
    {
      option: {
        id: "option2-groups",
        label: "Groups",
        icon: "standard:groups"
      },
      result: {
        objectApiName: "Group",
        optionLabelApiName: "Name",
        optionCommentApiName: "Type",
        conditions: ["Type = 'Regular'"]
      }
    },
    {
      option: {
        id: "option3-queues",
        label: "Queues",
        icon: "standard:queue"
      },
      result: {
        objectApiName: "Group",
        optionLabelApiName: "Name",
        optionCommentApiName: "Type",
        conditions: ["Type = 'Queue'"]
      }
    }
  ];
}
